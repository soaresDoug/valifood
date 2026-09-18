/**
 * Notificações locais (seção 5): agendadas no próprio dispositivo com
 * `expo-notifications`, sem servidor de push remoto.
 *
 * Cada produto vira um ou mais `notificationId` (um por ocorrência), salvos no
 * banco local vinculados ao produto para permitir cancelamento (seção 5.2/5.4).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Product } from '../types';
import {
  downsampleUniform,
  planRemindersForProduct,
  type PlanRemindersOptions,
  type PlannedReminder,
} from './notificationPlanner';

export const NOTIFICATION_CHANNEL_ID = 'valifood-expiry';
export const NOTIFICATION_CHANNEL_NAME = 'Lembretes de validade';
export const NOTIFICATION_DATA_KEY = 'valifood';

/**
 * Orçamento global de notificações pendentes: o iOS mantém no máximo 64
 * notificações locais agendadas por app, então mantemos uma margem de segurança
 * e redistribuímos o excedente priorizando o que vence antes.
 */
export const GLOBAL_NOTIFICATION_BUDGET = 60;

const isSupportedPlatform = Platform.OS === 'android' || Platform.OS === 'ios';

/** Faz a notificação aparecer mesmo com o app aberto em primeiro plano (5.2). */
export function configureNotificationHandler(): void {
  if (!isSupportedPlatform) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Canal Android (obrigatório no Android 8+) com cor e vibração do app. */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
  } catch (error) {
    console.warn('[notifications] falha ao criar canal Android', error);
  }
}

/** Pede a permissão de notificações (chamado no onboarding, com contexto). */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isSupportedPlatform) return false;
  try {
    await setupAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch (error) {
    console.warn('[notifications] falha ao pedir permissão', error);
    return false;
  }
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  if (!isSupportedPlatform) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
}

/** Todas as notificações pendentes agendadas pelo app (diagnóstico/testes). */
export async function listScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  if (!isSupportedPlatform) return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notifications] falha ao listar agendamentos', error);
    return [];
  }
}

export function isValifoodNotification(
  request: Notifications.NotificationRequest
): boolean {
  const data = request.content.data as Record<string, unknown> | null | undefined;
  return Boolean(data && data[NOTIFICATION_DATA_KEY] === true);
}

export async function countScheduledNotifications(): Promise<number> {
  const scheduled = await listScheduledNotifications();
  return scheduled.filter(isValifoodNotification).length;
}

/** Cancela ids específicos (usado ao excluir/consumir/excluir um produto). */
export async function cancelNotifications(ids: string[]): Promise<void> {
  if (!isSupportedPlatform) return;
  await Promise.all(
    ids.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        // Id já disparado/cancelado não é erro: o objetivo é não sobrar nada.
        console.warn('[notifications] falha ao cancelar', id, error);
      }
    })
  );
}

/** Cancela 100% das notificações pendentes de um produto (critério de aceite). */
export async function cancelProductNotifications(product: Product): Promise<void> {
  await cancelNotifications(product.notificationIds);
}

function toContent(planned: PlannedReminder, product: Product) {
  return {
    title: planned.title,
    body: planned.body,
    sound: 'default' as const,
    data: {
      [NOTIFICATION_DATA_KEY]: true,
      productId: product.id,
      barcode: product.barcode,
      kind: planned.kind,
      expirationDate: product.expirationDate,
    },
  };
}

/**
 * Agenda os lembretes de um único produto e devolve os ids criados.
 * Cancelar antes de reagendar garante idempotência (regra 5.4).
 */
export async function scheduleProductNotifications(
  product: Product,
  options: {
    now?: Date;
    overrides?: Partial<PlanRemindersOptions>;
    maxOccurrences?: number;
  } = {}
): Promise<string[]> {
  if (!isSupportedPlatform) return [];
  const { now = new Date(), overrides = {}, maxOccurrences } = options;

  await cancelProductNotifications(product);

  const planned = planRemindersForProduct(product, now, overrides);
  if (planned.length === 0) return [];
  const limited = maxOccurrences ? downsampleUniform(planned, maxOccurrences) : planned;

  const ids: string[] = [];
  for (const occurrence of limited) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: toContent(occurrence, product),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: occurrence.date,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
      ids.push(id);
    } catch (error) {
      console.warn('[notifications] falha ao agendar lembrete', error);
    }
  }
  return ids;
}

export interface RebuildResult {
  byProduct: Map<string, string[]>;
  totalScheduled: number;
  dropped: number;
}

/**
 * Reconstrói toda a agenda local respeitando o orçamento do SO.
 * Chamado ao abrir o app / voltar do background e quando os produtos mudam.
 */
export async function rebuildAllSchedules(
  products: Product[],
  options: {
    now?: Date;
    overrides?: Partial<PlanRemindersOptions>;
    budget?: number;
  } = {}
): Promise<RebuildResult> {
  const { now = new Date(), overrides = {}, budget = GLOBAL_NOTIFICATION_BUDGET } =
    options;

  const byProduct = new Map<string, string[]>();
  if (!isSupportedPlatform) return { byProduct, totalScheduled: 0, dropped: 0 };

  // Remove apenas o que é do ValiFood, preservando notificações de terceiros.
  const scheduled = await listScheduledNotifications();
  await cancelNotifications(
    scheduled.filter(isValifoodNotification).map((request) => request.identifier)
  );

  // Flatten cronológico: se o orçamento estourar, redistribuímos mantendo
  // cobertura de todos os produtos (o que vence antes aparece primeiro).
  // Inclui "active" e "expired": vencido ainda está na geladeira até o usuário
  // marcar como consumido/descartado.
  const entries: Array<{ product: Product; planned: PlannedReminder }> = [];
  for (const product of products.filter(
    (item) => item.status === 'active' || item.status === 'expired'
  )) {
    for (const planned of planRemindersForProduct(product, now, overrides)) {
      entries.push({ product, planned });
    }
  }
  entries.sort((a, b) => a.planned.date.getTime() - b.planned.date.getTime());

  const selected = downsampleUniform(entries, budget);
  const dropped = Math.max(0, entries.length - selected.length);

  for (const entry of selected) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: toContent(entry.planned, entry.product),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: entry.planned.date,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
      const current = byProduct.get(entry.product.id) ?? [];
      current.push(id);
      byProduct.set(entry.product.id, current);
    } catch (error) {
      console.warn('[notifications] falha ao reagendar', error);
    }
  }

  const totalScheduled = [...byProduct.values()].reduce((sum, ids) => sum + ids.length, 0);
  return { byProduct, totalScheduled, dropped };
}

/** Exemplos usados na tela de notificações (preview do design). */
export function buildNotificationPreview(now: Date = new Date()): Array<{
  title: string;
  body: string;
}> {
  const dd = `${now.getDate()}`.padStart(2, '0');
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const yyyy = now.getFullYear();
  return [
    {
      title: 'ValiFood',
      body: `ATENÇÃO! Seu frango vence hoje (${dd}/${mm}/${yyyy}). Não esqueça de consumir!`,
    },
    { title: 'Leite Integral', body: `Vence em 3 dias — ${dd}/${mm}/${yyyy}` },
    { title: 'Queijo Minas', body: 'Vence amanhã — não esqueça de consumir!' },
  ];
}

/** Observa o toque na notificação para abrir o produto (seção 5.3). */
export function addNotificationTapListener(
  handler: (productId: string | null) => void
): Notifications.EventSubscription | null {
  if (!isSupportedPlatform) return null;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handler(readProductIdFromResponse(response));
  });
}

function readProductIdFromResponse(
  response: Notifications.NotificationResponse
): string | null {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  return typeof data?.productId === 'string' ? data.productId : null;
}

/**
 * App aberto a partir de uma notificação (cold start): devolve o produto que
 * deve ser exibido. Também limpa a resposta para não repetir a navegação.
 */
export async function getInitialNotificationProductId(): Promise<string | null> {
  if (!isSupportedPlatform) return null;
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return null;
    const productId = readProductIdFromResponse(response);
    Notifications.clearLastNotificationResponse();
    return productId;
  } catch (error) {
    console.warn('[notifications] falha ao ler resposta inicial', error);
    return null;
  }
}
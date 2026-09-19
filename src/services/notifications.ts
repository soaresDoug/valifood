/**
 * Notificacoes locais (secao 5): agendadas no proprio dispositivo com
 * `expo-notifications`, sem servidor de push remoto.
 *
 * Compatibilidade com Expo Go (Android): desde o SDK 53 o Expo Go removeu o
 * suporte a push remoto, e o barrel `expo-notifications` registra um listener
 * de push token no proprio carregamento — o que lanca erro no Expo Go Android
 * (mesmo para apps que so usam notificacoes locais). Por isso carregamos o
 * modulo sob try/catch e degradamos graciosamente: o restante do app funciona
 * no Expo Go, e as notificacoes funcionam 100% em um development build.
 */
import Constants from 'expo-constants';
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
 * Orcamento global de notificacoes pendentes: o iOS mantem no maximo 64
 * notificacoes locais agendadas por app; mantemos margem de seguranca e
 * redistribuimos o excedente priorizando o que vence antes.
 */
export const GLOBAL_NOTIFICATION_BUDGET = 60;

type ExpoNotifications = typeof import('expo-notifications');
import type * as ExpoNotificationsNS from 'expo-notifications';

/** true quando o app roda dentro do Expo Go (store client). */
export function isRunningInExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

let notificationsModule: ExpoNotifications | null = null;
let loadError: string | null = null;

try {
  // Import dinamico: o import estatico quebraria o app no Expo Go Android.
  notificationsModule = require('expo-notifications') as ExpoNotifications;
} catch (error) {
  loadError = error instanceof Error ? error.message : String(error);
  console.warn('[notifications] expo-notifications indisponivel neste ambiente:', loadError);
}

/** Indica se as notificacoes locais podem ser usadas neste ambiente. */
export function areNotificationsAvailable(): boolean {
  return notificationsModule !== null && (Platform.OS === 'android' || Platform.OS === 'ios');
}

/** Motivo da indisponibilidade (usado no aviso da tela de Notificacoes). */
export function getNotificationsUnavailableReason(): string | null {
  if (notificationsModule) return null;
  if (isRunningInExpoGo()) {
    return 'O Expo Go (Android) nao suporta mais o expo-notifications. Rode com um development build (npx expo run:android) para testar os lembretes.';
  }
  return loadError ? `expo-notifications falhou ao carregar: ${loadError}` : null;
}

function notifications(): ExpoNotifications | null {
  return notificationsModule;
}

/** Faz a notificacao aparecer mesmo com o app aberto em primeiro plano (5.2). */
export function configureNotificationHandler(): void {
  const module = notifications();
  if (!module) return;
  module.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Canal Android (obrigatorio no Android 8+) com cor e vibracao do app. */
export async function setupAndroidChannel(): Promise<void> {
  const module = notifications();
  if (Platform.OS !== 'android' || !module) return;
  try {
    // O canal persiste no Android: recriamos para aplicar mudancas de som etc.
    // (sem o campo `sound`, o Android usa o som de notificacao padrao).
    await module.deleteNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
  } catch {
    // Primeira execucao: o canal ainda nao existe.
  }
  try {
    await module.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: module.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      lockscreenVisibility: module.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (error) {
    console.warn('[notifications] falha ao criar canal Android', error);
  }
}

/** Pede a permissao de notificacoes (chamado no onboarding, com contexto). */
export async function requestNotificationPermissions(): Promise<boolean> {
  const module = notifications();
  if (!module) return false;
  try {
    await setupAndroidChannel();
    const current = await module.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await module.requestPermissionsAsync();
    return asked.granted;
  } catch (error) {
    console.warn('[notifications] falha ao pedir permissao', error);
    return false;
  }
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  const module = notifications();
  if (!module) return false;
  try {
    const current = await module.getPermissionsAsync();
    return current.granted;
  } catch {
    return false;
  }
}

/** Todas as notificacoes pendentes agendadas pelo app (diagnostico/testes). */
export async function listScheduledNotifications(): Promise<
  ExpoNotificationsNS.NotificationRequest[]
> {
  const module = notifications();
  if (!module) return [];
  try {
    return await module.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notifications] falha ao listar agendamentos', error);
    return [];
  }
}

export function isValifoodNotification(
  request: ExpoNotificationsNS.NotificationRequest
): boolean {
  const data = request.content.data as Record<string, unknown> | null | undefined;
  return Boolean(data && data[NOTIFICATION_DATA_KEY] === true);
}

export async function countScheduledNotifications(): Promise<number> {
  const scheduled = await listScheduledNotifications();
  return scheduled.filter(isValifoodNotification).length;
}

/** Cancela ids especificos (usado ao excluir/consumir/editar um produto). */
export async function cancelNotifications(ids: string[]): Promise<void> {
  const module = notifications();
  if (!module) return;
  await Promise.all(
    ids.map(async (id) => {
      try {
        await module.cancelScheduledNotificationAsync(id);
      } catch (error) {
        // Id ja disparado/cancelado nao e erro: o objetivo e nao sobrar nada.
        console.warn('[notifications] falha ao cancelar', id, error);
      }
    })
  );
}

/** Cancela 100% das notificacoes pendentes de um produto (criterio de aceite). */
export async function cancelProductNotifications(product: Product): Promise<void> {
  await cancelNotifications(product.notificationIds);
}

function toContent(
  module: ExpoNotifications,
  planned: PlannedReminder,
  product: Product
) {
  return {
    title: planned.title,
    body: planned.body,
    // Sem o campo `sound`: assim o Android/iOS usam o som padrao do sistema.
    // Passar 'default' faz o modulo procurar um arquivo de audio inexistente.
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
 * Agenda os lembretes de um unico produto e devolve os ids criados.
 * Cancelar antes de reagendar garante idempotencia (regra 5.4).
 */
export async function scheduleProductNotifications(
  product: Product,
  options: {
    now?: Date;
    overrides?: Partial<PlanRemindersOptions>;
    maxOccurrences?: number;
  } = {}
): Promise<string[]> {
  const module = notifications();
  if (!module) return [];
  const { now = new Date(), overrides = {}, maxOccurrences } = options;

  await cancelProductNotifications(product);

  const planned = planRemindersForProduct(product, now, overrides);
  if (planned.length === 0) return [];
  const limited = maxOccurrences ? downsampleUniform(planned, maxOccurrences) : planned;

  const ids: string[] = [];
  for (const occurrence of limited) {
    try {
      const id = await module.scheduleNotificationAsync({
        content: toContent(module, occurrence, product),
        trigger: {
          type: module.SchedulableTriggerInputTypes.DATE,
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
 * Reconstrui toda a agenda local respeitando o orcamento do SO.
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
  const { now = new Date(), overrides = {}, budget = GLOBAL_NOTIFICATION_BUDGET } = options;

  const byProduct = new Map<string, string[]>();
  const module = notifications();
  if (!module) return { byProduct, totalScheduled: 0, dropped: 0 };

  // Remove apenas o que e do ValiFood, preservando notificacoes de terceiros.
  const scheduled = await listScheduledNotifications();
  await cancelNotifications(
    scheduled.filter(isValifoodNotification).map((request) => request.identifier)
  );

  // Flatten cronologico: se o orcamento estourar, redistribuimos mantendo
  // cobertura de todos os produtos (o que vence antes aparece primeiro).
  // Inclui "active" e "expired": vencido ainda esta na geladeira ate o usuario
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
      const id = await module.scheduleNotificationAsync({
        content: toContent(module, entry.planned, entry.product),
        trigger: {
          type: module.SchedulableTriggerInputTypes.DATE,
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

/**
 * Dispara uma notificacao agora mesmo (trigger null = entrega imediata).
 * Nao usa alarme: se essa chegar e a agenda de 1 min nao, o culpado e o
 * agendamento/alarmes exatos do aparelho — nao o canal nem o handler.
 */
export async function scheduleImmediateTestNotification(): Promise<{
  ok: boolean;
  error: string | null;
}> {
  const module = notifications();
  if (!module) return { ok: false, error: 'expo-notifications indisponivel neste aparelho/build' };
  const granted = await requestNotificationPermissions();
  if (!granted) return { ok: false, error: 'permissao do SO negada ou nao pedivel' };
  try {
    await module.scheduleNotificationAsync({
      content: {
        title: 'ValiFood — teste imediato',
        body: 'Notificacao imediata: canal e handler estao OK.',
        data: { [NOTIFICATION_DATA_KEY]: true, kind: 'test-immediate' },
      },
      trigger: null,
    });
    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface NotificationsDiagnostics {
  moduleLoaded: boolean;
  permissionGranted: boolean;
  channel: unknown;
  scheduledCount: number;
  scheduled: Array<{ id: string; title: string; channelId?: string; trigger?: unknown }>;
  error: string | null;
}

/** Leitura crua do canal + fila do SO para diagnosticar agendamento vs entrega. */
export async function getNotificationsDiagnostics(): Promise<NotificationsDiagnostics> {
  const module = notifications();
  const result: NotificationsDiagnostics = {
    moduleLoaded: module !== null,
    permissionGranted: false,
    channel: null,
    scheduledCount: 0,
    scheduled: [],
    error: null,
  };
  if (!module) {
    return { ...result, error: 'modulo expo-notifications nao carregou' };
  }
  try {
    result.permissionGranted = await isNotificationPermissionGranted();
    if (Platform.OS === 'android') {
      result.channel = await module.getNotificationChannelAsync(NOTIFICATION_CHANNEL_ID);
    }
    const scheduled = await module.getAllScheduledNotificationsAsync();
    result.scheduledCount = scheduled.length;
    result.scheduled = scheduled.map((item) => ({
      id: item.identifier,
      title: String(item.content.title ?? ''),
      channelId:
        typeof item.trigger === 'object' && item.trigger !== null
          ? String((item.trigger as Record<string, unknown>).channelId ?? '')
          : undefined,
      trigger: item.trigger,
    }));
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}

/**
 * Agenda uma notificacao de teste ~1 minuto a partir de agora.
 * Usada para validar o pipeline de notificacao sem esperar a agenda real.
 */
export async function scheduleTestNotification(
  delayMinutes = 1
): Promise<Date | null> {
  const result = await scheduleTestNotificationVerbose(delayMinutes);
  return result.scheduledAt;
}

export interface TestNotificationResult {
  /** true somente se a fila do SO confirmou o agendamento apos a chamada. */
  ok: boolean;
  /** Data alvo do lembrete (apenas quando ok). */
  scheduledAt: Date | null;
  /** Permissao do SO no momento da tentativa. */
  permissionGranted: boolean;
  /** Quantidade de ValiFood na fila do SO apos a tentativa. */
  pendingCount: number;
  /** Motivo tecnico quando ok === false. */
  error: string | null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Variante diagnostica do teste: pede permissao, executa o canal, agenda e
 * depois le a fila real do SO para confirmar se o item entrou na agenda.
 */
export async function scheduleTestNotificationVerbose(
  delayMinutes = 1
): Promise<TestNotificationResult> {
  const base: TestNotificationResult = {
    ok: false,
    scheduledAt: null,
    permissionGranted: false,
    pendingCount: await countScheduledNotifications(),
    error: null,
  };
  const module = notifications();
  if (!module) {
    return { ...base, error: 'expo-notifications indisponivel neste aparelho/build' };
  }

  const granted = await requestNotificationPermissions();
  const afterPermission: TestNotificationResult = {
    ...base,
    permissionGranted: granted,
    pendingCount: await countScheduledNotifications(),
  };
  if (!granted) {
    return { ...afterPermission, error: 'permissao do SO negada ou nao pedivel' };
  }

  const when = new Date(Date.now() + delayMinutes * 60_000);
  try {
    await module.scheduleNotificationAsync({
      content: {
        title: 'ValiFood — teste de notificacao',
        body: 'Se voce esta vendo isso, os lembretes locais estao funcionando!',
        data: { [NOTIFICATION_DATA_KEY]: true, kind: 'test' },
      },
      trigger: {
        type: module.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
  } catch (error) {
    return {
      ...afterPermission,
      pendingCount: await countScheduledNotifications(),
      error: `scheduleNotificationAsync falhou: ${errorMessage(error)}`,
    };
  }

  const pendingCount = await countScheduledNotifications();
  if (pendingCount <= afterPermission.pendingCount) {
    return {
      ...afterPermission,
      pendingCount,
      error: `agendamento aceito, mas a fila do SO nao mudou (${afterPermission.pendingCount} -> ${pendingCount})`,
    };
  }

  return { ...afterPermission, ok: true, scheduledAt: when, pendingCount };
}

/** Exemplos usados na tela de notificacoes (preview do design). */
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
      body: `ATENCAO! Seu frango vence hoje (${dd}/${mm}/${yyyy}). Nao esqueca de consumir!`,
    },
    { title: 'Leite Integral', body: `Vence em 3 dias — ${dd}/${mm}/${yyyy}` },
    { title: 'Queijo Minas', body: 'Vence amanha — nao esqueca de consumir!' },
  ];
}

function readProductIdFromResponse(
  response: ExpoNotificationsNS.NotificationResponse
): string | null {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  return typeof data?.productId === 'string' ? data.productId : null;
}

/** Observa o toque na notificacao para abrir o produto (secao 5.3). */
export function addNotificationTapListener(
  handler: (productId: string | null) => void
): { remove: () => void } | null {
  const module = notifications();
  if (!module) return null;
  const subscription = module.addNotificationResponseReceivedListener((response) => {
    handler(readProductIdFromResponse(response));
  });
  return { remove: () => subscription.remove() };
}

/**
 * App aberto a partir de uma notificacao (cold start): devolve o produto que
 * deve ser exibido e limpa a resposta para nao repetir a navegacao.
 */
export async function getInitialNotificationProductId(): Promise<string | null> {
  const module = notifications();
  if (!module) return null;
  try {
    const response = await module.getLastNotificationResponseAsync();
    if (!response) return null;
    const productId = readProductIdFromResponse(response);
    module.clearLastNotificationResponse();
    return productId;
  } catch (error) {
    console.warn('[notifications] falha ao ler resposta inicial', error);
    return null;
  }
}
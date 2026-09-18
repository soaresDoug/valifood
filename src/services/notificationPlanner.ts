/**
 * Planejamento das notificações locais (módulo puro, testável).
 *
 * Regras de negócio implementadas (seções 4.2 e 5.4 da especificação):
 * 1. O primeiro lembrete é calculado **retroativamente a partir da data de
 *    validade** (as ocorrências ficam ancoradas na validade, não em "hoje").
 * 2. Nunca agendamos lembretes depois da validade — apenas uma notificação
 *    final de "produto vencido" (1 dia depois da validade).
 * 3. Só agendamos datas futuras (o SO descartaria triggers no passado).
 *
 * Os triggers são do tipo `DATE` (um por ocorrência) em vez de
 * `DAILY`/`WEEKLY`/`TIME_INTERVAL` porque um trigger de repetição não pode ser
 * interrompido na data de validade (violaria a regra 2) e não pode ser
 * cancelado sem que o app rode. Cada ocorrência é salva em `notificationIds`
 * para permitir o cancelamento individual exigido pela seção 5.4.
 */
import { FIXED_INTERVALS } from '../constants/reminders';
import type { Product, ReminderFrequency } from '../types';
import {
  addDays,
  diffInDays,
  formatDateBR,
  MS_PER_DAY,
  parseISODate,
  startOfDay,
} from '../utils/dates';

export type ReminderKind = 'reminder' | 'expired';

export interface PlannedReminder {
  kind: ReminderKind;
  date: Date;
  /** Dias restantes até a validade no momento do disparo (0 = vence hoje). */
  daysUntilExpiration: number;
  /** Posição na sequência planejada (0 = primeira ocorrência). */
  index: number;
  title: string;
  body: string;
}

export interface PlanRemindersOptions {
  expirationDate: string | Date;
  frequency: ReminderFrequency;
  customIntervalDays?: number | null;
  now?: Date;
  hour?: number;
  minute?: number;
  includeExpiredAlert?: boolean;
  /** Limite de segurança para evitar loops com datas muito distantes. */
  hardLimit?: number;
}

export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;
const DEFAULT_HARD_LIMIT = 400;

function atTime(date: Date, hour: number, minute: number): Date {
  const copy = new Date(date.getTime());
  copy.setHours(hour, minute, 0, 0);
  return copy;
}

/** Offsets (em dias) em relação à validade para cada frequência. */
export function reminderOffsets(
  frequency: ReminderFrequency,
  customIntervalDays?: number | null
): number[] {
  if (frequency === '1_day_before') return [1];
  return [effectiveIntervalDays(frequency, customIntervalDays)];
}

/** Intervalo efetivo em dias (usado para exibir a frequência na UI). */
export function effectiveIntervalDays(
  frequency: ReminderFrequency,
  customIntervalDays?: number | null
): number {
  if (frequency === '1_day_before') return 1;
  if (frequency === 'custom') return Math.max(1, Math.round(customIntervalDays ?? 1));
  return FIXED_INTERVALS[frequency] ?? 1;
}

/** Conteúdo dinâmico da notificação (seção 5.3). */
export function buildNotificationContent(
  productName: string,
  expirationDate: string | Date,
  kind: ReminderKind,
  daysUntilExpiration: number
): { title: string; body: string } {
  const expiration = formatDateBR(
    typeof expirationDate === 'string' ? parseISODate(expirationDate) : expirationDate
  );
  const prefix = productName ? `${productName}` : 'Produto';
  if (kind === 'expired') {
    return {
      title: `${prefix} venceu`,
      body: `A validade era ${expiration}. Verifique o produto antes de consumir.`,
    };
  }
  if (daysUntilExpiration <= 0) {
    return {
      title: prefix,
      body: `Vence hoje (${expiration}) — não esqueça de consumir!`,
    };
  }
  if (daysUntilExpiration === 1) {
    return {
      title: prefix,
      body: `Vence amanhã (${expiration}) — não esqueça de consumir!`,
    };
  }
  return {
    title: prefix,
    body: `Vence em ${daysUntilExpiration} dias — ${expiration}`,
  };
}

/**
 * Gera a agenda completa de lembretes de um produto.
 * Retorna em ordem cronológica crescente, apenas datas futuras.
 */
export function planReminders(options: PlanRemindersOptions): PlannedReminder[] {
  const {
    expirationDate,
    frequency,
    customIntervalDays = null,
    now = new Date(),
    hour = DEFAULT_REMINDER_HOUR,
    minute = DEFAULT_REMINDER_MINUTE,
    includeExpiredAlert = true,
    hardLimit = DEFAULT_HARD_LIMIT,
  } = options;

  const expiration = startOfDay(
    typeof expirationDate === 'string' ? parseISODate(expirationDate) : expirationDate
  );
  const today = startOfDay(now);
  const interval = effectiveIntervalDays(frequency, customIntervalDays);

  // 1) Ancora as ocorrências na validade e retrocede até passar de hoje.
  const anchors: Date[] = [];
  if (frequency === '1_day_before') {
    // Frequência "apenas 1 dia antes": uma única ocorrência, em validade - 1.
    const single = addDays(expiration, -1);
    if (single.getTime() >= today.getTime()) anchors.push(single);
  } else {
    for (let k = 0; k < hardLimit; k += 1) {
      const anchor = addDays(expiration, -interval * k);
      if (anchor.getTime() < today.getTime()) break;
      anchors.push(anchor);
    }
  }

  // 2) Aplica a hora do lembrete, descarta o passado e ordena do mais próximo.
  const reminders: PlannedReminder[] = anchors
    .map((anchor) => atTime(anchor, hour, minute))
    .filter((date) => date.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date, index) => {
      const daysUntilExpiration = diffInDays(expiration, date);
      const content = buildNotificationContent('', expiration, 'reminder', daysUntilExpiration);
      return {
        kind: 'reminder' as ReminderKind,
        date,
        daysUntilExpiration,
        index,
        title: content.title,
        body: content.body,
      };
    });

  // 3) Notificação final de "produto vencido" (nunca antes disso).
  if (includeExpiredAlert) {
    const expiredAt = atTime(addDays(expiration, 1), hour, minute);
    if (expiredAt.getTime() > now.getTime()) {
      const content = buildNotificationContent('', expiration, 'expired', -1);
      reminders.push({
        kind: 'expired',
        date: expiredAt,
        daysUntilExpiration: diffInDays(expiration, expiredAt),
        index: reminders.length,
        title: content.title,
        body: content.body,
      });
    }
  }

  return reminders;
}

/** Quantidade total de notificações que um produto vai gerar. */
export function countPlannedReminders(options: PlanRemindersOptions): number {
  return planReminders(options).length;
}

/**
 * Reduz a lista mantendo a cobertura de forma uniforme. Usado quando o total
 * de notificações passa do orçamento do sistema operacional: o iOS limita a
 * 64 notificações locais pendentes por aplicativo.
 */
export function downsampleUniform<T>(items: T[], max: number): T[] {
  if (max <= 0) return [];
  if (items.length <= max) return items;
  if (max === 1) return [items[items.length - 1]];
  const step = (items.length - 1) / (max - 1);
  const picked: T[] = [];
  for (let i = 0; i < max; i += 1) {
    picked.push(items[Math.round(i * step)]);
  }
  return picked;
}

/** Próximo lembrete de um produto (usado na tela de detalhes). */
export function nextReminderDate(options: PlanRemindersOptions): Date | null {
  const reminders = planReminders(options).filter((item) => item.kind === 'reminder');
  return reminders.length > 0 ? reminders[0].date : null;
}

/** Atalho para um produto já persistido (preenche o nome no conteúdo). */
export function planRemindersForProduct(
  product: Product,
  now: Date = new Date(),
  overrides: Partial<PlanRemindersOptions> = {}
): PlannedReminder[] {
  return planReminders({
    expirationDate: product.expirationDate,
    frequency: product.reminderFrequency,
    customIntervalDays: product.customIntervalDays,
    now,
    ...overrides,
  }).map((item) => {
    const content = buildNotificationContent(
      product.name,
      product.expirationDate,
      item.kind,
      item.daysUntilExpiration
    );
    return { ...item, title: content.title, body: content.body };
  });
}

/** Intervalo entre disparos em ms (usado nos resumos da UI). */
export function reminderIntervalMs(
  frequency: ReminderFrequency,
  customIntervalDays?: number | null
): number {
  return effectiveIntervalDays(frequency, customIntervalDays) * MS_PER_DAY;
}

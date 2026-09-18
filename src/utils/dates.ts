/**
 * Utilitários de data do ValiFood.
 * Módulo puro: todas as funções recebem `now`/datas como parâmetro para serem
 * determinísticas e testáveis.
 */
import type { UrgencyLevel } from '../theme/colors';

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Converte 'yyyy-mm-dd' (ou Date) em Date no início do dia local. */
export function parseISODate(value: string | Date): Date {
  if (value instanceof Date) {
    return startOfDay(value);
  }
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 0, 0, 0, 0);
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** 'yyyy-mm-dd' — formato usado no banco local (comparável como texto). */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date: Date, months: number): Date {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

/** Diferença em dias de calendário (positivo = futuro). */
export function diffInDays(target: Date, from: Date): number {
  const a = startOfDay(target).getTime();
  const b = startOfDay(from).getTime();
  return Math.round((a - b) / MS_PER_DAY);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** dd/MM/yyyy */
export function formatDateBR(value: string | Date | null): string {
  if (!value) return '--/--/----';
  const date = typeof value === 'string' ? parseISODate(value) : value;
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** dd/MM - HH:mm (usado no histórico e nas notificações) */
export function formatDateTimeShort(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${day}/${month} - ${hour}:${minute}`;
}

/** HH:mm */
export function formatTime(date: Date): string {
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

/** dd/MM/yyyy a partir de string digitada em pt-BR (validação de entrada). */
export function parseDateBR(input: string): Date | null {
  const match = input.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return valid ? date : null;
}

/** Texto de urgência: "Vence hoje", "Vence em 2 dias", "Venceu há 3 dias". */
export function formatExpirationLabel(
  expiration: string | Date,
  now: Date = new Date()
): string {
  const days = diffInDays(
    typeof expiration === 'string' ? parseISODate(expiration) : expiration,
    now
  );
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  if (days > 1) return `Vence em ${days} dias`;
  if (days === -1) return 'Venceu ontem';
  return `Venceu há ${Math.abs(days)} dias`;
}

/** Nível de urgência conforme seção 4.3 da especificação. */
export function getUrgencyLevel(
  expiration: string | Date,
  now: Date = new Date()
): UrgencyLevel {
  const days = diffInDays(
    typeof expiration === 'string' ? parseISODate(expiration) : expiration,
    now
  );
  if (days < 0) return 'expired';
  if (days <= 2) return 'critical';
  if (days <= 7) return 'soon';
  return 'safe';
}

export function getDaysUntilExpiration(
  expiration: string | Date,
  now: Date = new Date()
): number {
  return diffInDays(
    typeof expiration === 'string' ? parseISODate(expiration) : expiration,
    now
  );
}

/** Rótulo de agrupamento do histórico: Hoje / Ontem / dd/MM/yyyy. */
export function formatDayGroup(value: string | Date, now: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const days = diffInDays(date, now);
  if (days === 0) return 'Hoje';
  if (days === -1) return 'Ontem';
  return formatDateBR(date);
}

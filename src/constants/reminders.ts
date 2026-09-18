import type { ReminderFrequency } from '../types';

export interface ReminderOption {
  value: ReminderFrequency;
  label: string;
  shortLabel: string;
  description: string;
}

/**
 * Opções de frequência do lembrete (seção 4.2 da especificação).
 * As regras numéricas do agendamento ficam em `services/notificationPlanner`.
 */
export const REMINDER_OPTIONS: ReminderOption[] = [
  {
    value: 'daily',
    label: 'A cada dia',
    shortLabel: 'Diário',
    description: 'Um lembrete todos os dias até a validade',
  },
  {
    value: 'every_3_days',
    label: 'A cada 3 dias',
    shortLabel: '3 dias',
    description: 'Um lembrete a cada 3 dias até a validade',
  },
  {
    value: 'weekly',
    label: 'Semanalmente',
    shortLabel: 'Semanal',
    description: 'Um lembrete por semana até a validade',
  },
  {
    value: '1_day_before',
    label: 'Apenas 1 dia antes de vencer',
    shortLabel: '1 dia antes',
    description: 'Um único lembrete, 1 dia antes da validade',
  },
  {
    value: 'custom',
    label: 'Personalizado',
    shortLabel: 'Personalizado',
    description: 'Você escolhe o intervalo em dias',
  },
];

export const DEFAULT_REMINDER_FREQUENCY: ReminderFrequency = 'every_3_days';
export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;

/** Intervalo (em dias) de cada frequência fixa. `null` = personalizado. */
export const FIXED_INTERVALS: Record<Exclude<ReminderFrequency, 'custom'>, number | null> = {
  daily: 1,
  every_3_days: 3,
  weekly: 7,
  '1_day_before': null,
};

export function getReminderOption(frequency: ReminderFrequency): ReminderOption {
  return (
    REMINDER_OPTIONS.find((option) => option.value === frequency) ?? REMINDER_OPTIONS[0]
  );
}

export function describeReminderFrequency(
  frequency: ReminderFrequency,
  customIntervalDays: number | null
): string {
  if (frequency === 'custom') {
    const days = customIntervalDays ?? 0;
    return days === 1 ? 'A cada dia' : `A cada ${days} dias`;
  }
  return getReminderOption(frequency).label;
}
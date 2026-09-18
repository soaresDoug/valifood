import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { REMINDER_OPTIONS } from '../constants/reminders';
import { colors, radii, spacing } from '../theme';
import type { ReminderFrequency } from '../types';
import { AppText } from './AppText';
import { TextField } from './TextField';

export interface FrequencyPickerProps {
  value: ReminderFrequency;
  customIntervalDays: number | null;
  onChange: (value: ReminderFrequency) => void;
  onCustomDaysChange: (days: number) => void;
  error?: string | null;
  hint?: string;
}

/**
 * Seletor da frequência do lembrete (obrigatório) — seção 4.2.
 * Em "Personalizado" o usuário digita o intervalo em dias.
 */
export function FrequencyPicker({
  value,
  customIntervalDays,
  onChange,
  onCustomDaysChange,
  error,
  hint,
}: FrequencyPickerProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.label}>
        Frequência do lembrete
      </AppText>

      <View style={styles.options}>
        {REMINDER_OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(option.value)}
              style={[styles.option, isActive && styles.optionActive]}
            >
              <MaterialCommunityIcons
                name={isActive ? 'check-circle-outline' : 'clock-outline'}
                size={18}
                color={isActive ? colors.primary : colors.textSecondary}
                style={styles.optionIcon}
              />
              <View style={styles.optionText}>
                <AppText
                  variant="label"
                  color={isActive ? colors.primary : colors.textPrimary}
                >
                  {option.label}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {option.description}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {value === 'custom' ? (
        <TextField
          label="Intervalo personalizado"
          value={customIntervalDays ? String(customIntervalDays) : ''}
          onChangeText={(text) => {
            const parsed = Number(text.replace(/\D/g, ''));
            onCustomDaysChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          keyboardType="number-pad"
          placeholder="Ex.: 5"
          suffix="dias"
          maxLength={3}
          hint="O app avisa a cada X dias até a data de validade."
        />
      ) : null}

      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.successSoft },
  optionIcon: { marginRight: spacing.md },
  optionText: { flex: 1 },
});
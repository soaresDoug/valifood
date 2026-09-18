import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { formatDateBR, parseISODate, startOfDay, toISODate } from '../utils/dates';
import { AppText } from './AppText';
import { Button } from './Button';

export interface DateFieldProps {
  label: string;
  /** Data no formato ISO (yyyy-mm-dd) ou null. */
  value: string | null;
  onChange: (isoDate: string) => void;
  error?: string | null;
  hint?: string;
  /** Menor data permitida — validade no passado não é aceita (seção 4.2). */
  minimumDate?: Date;
}

/**
 * Campo de data de validade com calendário nativo
 * (`@react-native-community/datetimepicker`).
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  hint,
  minimumDate,
}: DateFieldProps) {
  const today = startOfDay(new Date());
  const min = minimumDate ?? today;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? parseISODate(value) : min);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selected) {
        onChange(toISODate(startOfDay(selected)));
      }
      return;
    }
    if (selected) setDraft(startOfDay(selected));
  };

  return (
    <View style={styles.container}>
      <AppText variant="label" style={styles.label}>
        {label}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateBR(value) : 'não informada'}`}
        onPress={() => {
          setDraft(value ? parseISODate(value) : min);
          setOpen(true);
        }}
        style={[styles.field, { borderColor: error ? colors.danger : colors.border }]}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={18}
          color={colors.textSecondary}
          style={styles.icon}
        />
        <AppText
          variant="body"
          color={value ? colors.textPrimary : colors.textMuted}
          style={styles.value}
        >
          {value ? formatDateBR(value) : 'DD / MM / AAAA'}
        </AppText>
        <MaterialCommunityIcons name="calendar-month" size={22} color={colors.primary} />
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.message}>
          {hint}
        </AppText>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          mode="date"
          display="calendar"
          value={draft}
          minimumDate={min}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
              <AppText variant="subtitle" center style={styles.sheetTitle}>
                {label}
              </AppText>
              <DateTimePicker
                mode="date"
                display="inline"
                value={draft}
                minimumDate={min}
                onChange={handleChange}
                locale="pt-BR"
              />
              <Button
                label="Confirmar"
                onPress={() => {
                  onChange(toISODate(draft));
                  setOpen(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  icon: { marginRight: spacing.sm },
  value: { flex: 1 },
  message: { marginTop: spacing.xs },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { marginBottom: spacing.sm },
});
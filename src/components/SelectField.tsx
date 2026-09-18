import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

export interface SelectOption {
  value: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface SelectFieldProps {
  label?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string | null;
  modalTitle?: string;
}

/** Campo de seleção (categoria, unidade) com modal de opções. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  icon,
  error,
  modalTitle,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: error ? colors.danger : colors.border }]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.textSecondary}
            style={styles.fieldIcon}
          />
        ) : null}
        {selected?.icon ? (
          <MaterialCommunityIcons
            name={selected.icon}
            size={18}
            color={colors.primary}
            style={styles.fieldIcon}
          />
        ) : null}
        <AppText
          variant="body"
          color={selected ? colors.textPrimary : colors.textMuted}
          style={styles.fieldText}
        >
          {selected?.label ?? placeholder}
        </AppText>
        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <AppText variant="subtitle">{modalTitle ?? label ?? 'Selecione'}</AppText>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    {item.icon ? (
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={styles.optionIcon}
                      />
                    ) : null}
                    <AppText variant="body" style={styles.optionLabel}>
                      {item.label}
                    </AppText>
                    {isSelected ? (
                      <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
  fieldIcon: { marginRight: spacing.sm },
  fieldText: { flex: 1 },
  message: { marginTop: spacing.xs },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  optionSelected: { backgroundColor: colors.successSoft },
  optionPressed: { backgroundColor: colors.surfaceMuted },
  optionIcon: { marginRight: spacing.md },
  optionLabel: { flex: 1 },
});
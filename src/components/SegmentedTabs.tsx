import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

export interface SegmentedTabsProps<T extends string> {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

/** Abas em cápsula (Todos / Em estoque / Consumidos / Descartados). */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
}: SegmentedTabsProps<T>) {
  const content = (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <AppText
              variant="label"
              color={isActive ? colors.textOnPrimary : colors.textSecondary}
            >
              {option.count !== undefined ? `${option.label} (${option.count})` : option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return <View style={styles.container}>{content}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
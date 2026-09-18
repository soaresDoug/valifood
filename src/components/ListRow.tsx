import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

export interface ListRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Linhas de informação (sem seta) usadas na tela de detalhes. */
  variant?: 'action' | 'info';
  showChevron?: boolean;
}

/** Linha de menu/informação (telas de perfil, menu lateral e detalhes). */
export function ListRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  variant = 'action',
  showChevron,
}: ListRowProps) {
  const tint = destructive ? colors.danger : colors.textSecondary;
  const withChevron = showChevron ?? variant === 'action';

  const content = (
    <>
      <MaterialCommunityIcons name={icon} size={20} color={tint} style={styles.icon} />
      <AppText
        variant="body"
        color={destructive ? colors.danger : colors.textPrimary}
        style={styles.label}
      >
        {label}
      </AppText>
      {value ? (
        <AppText variant="body" color={colors.textSecondary} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {withChevron ? (
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (variant === 'info' || !onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  icon: { marginRight: spacing.md, width: 22 },
  label: { flex: 1 },
  value: { marginRight: spacing.sm },
});
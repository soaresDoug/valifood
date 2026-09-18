import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';

export interface BannerProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'warning' | 'success';
  onClose?: () => void;
}

const TONES = {
  info: { background: colors.successSoft, border: colors.primaryLight, tint: colors.primary },
  warning: { background: colors.warningSoft, border: colors.warning, tint: '#9A6B00' },
  success: { background: colors.successSoft, border: colors.success, tint: '#2E7D45' },
} as const;

/** Faixa informativa (permissão de notificação, avisos de conexão, etc.). */
export function Banner({
  icon = 'information-outline',
  title,
  description,
  actionLabel,
  onAction,
  tone = 'info',
  onClose,
}: BannerProps) {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.background, borderColor: palette.border },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={palette.tint} />
      <View style={styles.content}>
        <AppText variant="label" color={palette.tint}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary} style={styles.description}>
            {description}
          </AppText>
        ) : null}
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
            <AppText variant="label" color={palette.tint} style={styles.action}>
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {onClose ? (
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Fechar aviso">
          <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  content: { flex: 1 },
  description: { marginTop: 2 },
  action: { marginTop: spacing.xs, textDecorationLine: 'underline' },
});
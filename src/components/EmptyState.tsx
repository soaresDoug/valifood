import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Estado vazio das listas (estoque/histórico sem itens). */
export function EmptyState({
  icon = 'package-variant',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons name={icon} size={34} color={colors.primaryLight} />
      </View>
      <AppText variant="subtitle" center style={styles.title}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" color={colors.textSecondary} center style={styles.description}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { marginBottom: spacing.xs },
  description: { maxWidth: 280 },
  action: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  right?: ReactNode;
  /** Cabeçalho sobre fundo escuro (tela do scanner). */
  dark?: boolean;
  large?: boolean;
}

/** Cabeçalho de tela com voltar/fechar, título e ação opcional à direita. */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  onClose,
  right,
  dark = false,
  large = false,
}: ScreenHeaderProps) {
  const tint = dark ? colors.textOnPrimary : colors.textPrimary;
  return (
    <View style={[styles.container, dark && styles.containerDark]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={tint} />
        </Pressable>
      ) : null}

      <View style={styles.titles}>
        <AppText variant={large ? 'title' : 'subtitle'} color={tint} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={dark ? colors.accent : colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="close" size={24} color={tint} />
        </Pressable>
      ) : null}

      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  containerDark: { paddingHorizontal: spacing.lg },
  iconButton: { paddingRight: spacing.sm },
  titles: { flex: 1 },
});
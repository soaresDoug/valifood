import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, textVariants } from '../theme';
import { AppText } from './AppText';

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'light'
  | 'accent';

export type ButtonSize = 'md' | 'sm' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const PALETTE: Record<ButtonVariant, { background: string; text: string; border?: string }> = {
  primary: { background: colors.primary, text: colors.textOnPrimary },
  outline: { background: colors.surface, text: colors.primary, border: colors.primary },
  ghost: { background: 'transparent', text: colors.primary },
  danger: { background: colors.danger, text: colors.textOnPrimary },
  light: { background: colors.surface, text: colors.primary },
  accent: { background: colors.accent, text: colors.primaryDark },
};

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: 46, lg: 52 };
const FONT_SIZES: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 16 };

/** Botão padrão do app (primário, contorno, fantasma, perigo, claro, acento). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const palette = PALETTE[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: HEIGHTS[size],
          backgroundColor: palette.background,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1.5 : 0,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
        },
        variant === 'primary' && shadows.card,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <MaterialCommunityIcons
              name={icon}
              size={FONT_SIZES[size] + 4}
              color={palette.text}
              style={styles.iconLeft}
            />
          ) : null}
          <AppText
            variant="button"
            color={palette.text}
            style={{ ...textVariants.button, fontSize: FONT_SIZES[size] }}
          >
            {label}
          </AppText>
          {icon && iconPosition === 'right' ? (
            <MaterialCommunityIcons
              name={icon}
              size={FONT_SIZES[size] + 4}
              color={palette.text}
              style={styles.iconRight}
            />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
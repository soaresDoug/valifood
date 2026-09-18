import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, textVariants, type TextVariant } from '../theme';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  center?: boolean;
}

/**
 * Texto padrão do app: aplica a variante tipográfica Inter e a cor da paleta.
 */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const override: TextStyle = {};
  if (weight) {
    const family = {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    }[weight];
    override.fontFamily = family;
  }
  if (center) override.textAlign = 'center';

  return <Text {...rest} style={[textVariants[variant], { color }, override, style]} />;
}
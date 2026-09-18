import { Platform, TextStyle } from 'react-native';

/**
 * Tipografia Inter (conforme especificação de design):
 * - Títulos: 20–24px (semibold)
 * - Subtítulos: 16–18px (medium)
 * - Texto: 14px (regular)
 * - Botões: 16px (medium)
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Fallback nativo caso as fontes ainda não estejam carregadas. */
export const fontFamilyFallback = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
}) as string;

type Variant =
  | 'title'
  | 'titleLarge'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'button'
  | 'caption'
  | 'tiny';

export const textVariants: Record<Variant, TextStyle> = {
  titleLarge: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 },
  bodySmall: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 18 },
  button: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 20 },
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 },
  tiny: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14 },
};

export type TextVariant = Variant;
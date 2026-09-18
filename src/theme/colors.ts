/**
 * Paleta de cores do ValiFood.
 * Fonte: especificação de design (imagem de referência) — paleta oficial:
 * #085D38, #4CAF50, #A8D96C, #F7FAF8, #1F2933, #687280, #F5B822, #E53935
 */
export const colors = {
  // Marca
  primary: '#085D38',
  primaryDark: '#064B2D',
  primaryLight: '#4CAF50',
  accent: '#A8D96C',
  accentDark: '#8CC44F',

  // Superfícies
  background: '#F7FAF8',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F6F3',
  border: '#E3EAE5',

  // Texto
  textPrimary: '#1F2933',
  textSecondary: '#687280',
  textOnPrimary: '#FFFFFF',
  textMuted: '#9AA5B1',

  // Semântica / urgência
  danger: '#E53935',
  dangerSoft: '#FDECEA',
  warning: '#F5B822',
  warningSoft: '#FEF4E2',
  success: '#4CAF50',
  successSoft: '#EAF6EF',
  info: '#4CAF50',

  // Tons auxiliares usados nos ícones das categorias
  categoryMeat: '#E53935',
  categoryDairy: '#F5B822',
  categoryCheese: '#E9A23B',
  categoryGrains: '#4CAF50',
  categoryYogurt: '#3E8FD8',
  categoryProduce: '#8CC44F',
  categoryBakery: '#C98A5B',
  categoryDrinks: '#2FB3A6',
  categoryCleaning: '#687280',
  categoryHygiene: '#9B7BD4',
  categoryOther: '#687280',

  overlay: 'rgba(12, 32, 21, 0.45)',
  shadow: '#0B2E1D',
} as const;

export type UrgencyLevel = 'safe' | 'soon' | 'critical' | 'expired';

/** Cores por nível de urgência da validade (verde / amarelo / vermelho). */
export const urgencyColors: Record<
  UrgencyLevel,
  { text: string; soft: string; solid: string; label: string }
> = {
  safe: {
    text: '#2E7D45',
    soft: colors.successSoft,
    solid: colors.primaryLight,
    label: 'No prazo',
  },
  soon: {
    text: '#9A6B00',
    soft: colors.warningSoft,
    solid: colors.warning,
    label: 'Atenção',
  },
  critical: {
    text: '#B32320',
    soft: colors.dangerSoft,
    solid: colors.danger,
    label: 'Vence logo',
  },
  expired: {
    text: '#7A1613',
    soft: '#F8D7D5',
    solid: '#B71C1C',
    label: 'Vencido',
  },
};
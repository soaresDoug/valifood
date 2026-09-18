import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { getCategory } from '../constants/categories';
import { colors, radii } from '../theme';
import { AppText } from './AppText';

export interface ProductAvatarProps {
  category: string;
  imageUrl?: string | null;
  size?: number;
  /** Cor de fundo do círculo; por padrão usa a cor da categoria. */
  backgroundColor?: string;
}

/**
 * Ícone circular do produto: usa a foto quando existe e cai no ícone da
 * categoria quando a API não devolveu imagem (design telas 3, 8 e 11).
 */
export function ProductAvatar({
  category,
  imageUrl,
  size = 44,
  backgroundColor,
}: ProductAvatarProps) {
  const info = getCategory(category);

  if (imageUrl) {
    return (
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      >
        <Image source={{ uri: imageUrl }} style={{ width: size - 8, height: size - 8 }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: backgroundColor ?? info.color,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={info.icon}
        size={size * 0.5}
        color={colors.textOnPrimary}
      />
    </View>
  );
}

export interface UrgencyBadgeProps {
  label: string;
  color: string;
  softColor: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

/** Etiqueta de urgência ("Vence em 2 dias", "Vencido"). */
export function UrgencyBadge({ label, color, softColor, icon = 'clock-outline' }: UrgencyBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: softColor }]}>
      <MaterialCommunityIcons name={icon} size={13} color={color} style={styles.badgeIcon} />
      <AppText variant="tiny" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  badgeIcon: { marginRight: 4 },
});
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { getCategory } from '../constants/categories';
import { colors, radii, shadows, spacing } from '../theme';
import { urgencyColors } from '../theme/colors';
import type { Product } from '../types';
import { formatDateTimeShort, formatExpirationLabel, getUrgencyLevel } from '../utils/dates';
import { AppText } from './AppText';
import { ProductAvatar, UrgencyBadge } from './ProductAvatar';

export interface ProductListItemProps {
  product: Product;
  onPress?: () => void;
  /** Toque longo abre as ações rápidas (consumir/descartar/excluir). */
  onLongPress?: () => void;
  /** Texto à direita (ex.: "2 un." na tela de estoque). */
  trailingText?: string;
  /** Nome da categoria abaixo do título (tela de estoque). */
  showCategory?: boolean;
  now?: Date;
}

/**
 * Item de lista de produto: borda colorida à esquerda indicando urgência
 * (verde > 7 dias, amarelo 3–7 dias, vermelho ≤ 2 dias/vencido) — seção 4.3.
 */
export function ProductListItem({
  product,
  onPress,
  onLongPress,
  trailingText,
  showCategory = false,
  now = new Date(),
}: ProductListItemProps) {
  const urgency = urgencyColors[getUrgencyLevel(product.expirationDate, now)];
  const isClosed = product.status === 'consumed' || product.status === 'discarded';
  const label =
    product.status === 'consumed'
      ? `Consumido${product.consumedAt ? ` ${formatDateTimeShort(product.consumedAt)}` : ''}`
      : product.status === 'discarded'
        ? `Descartado${product.discardedAt ? ` ${formatDateTimeShort(product.discardedAt)}` : ''}`
        : formatExpirationLabel(product.expirationDate, now);

  const badgeColor = isClosed ? colors.textSecondary : urgency.text;
  const badgeSoft = isClosed ? colors.surfaceMuted : urgency.soft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${label}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.container,
        { borderLeftColor: isClosed ? colors.border : urgency.solid },
        pressed && styles.pressed,
      ]}
    >
      <ProductAvatar category={product.category} imageUrl={product.imageUrl} />

      <View style={styles.content}>
        <AppText variant="subtitle" numberOfLines={1} style={styles.name}>
          {product.name}
        </AppText>
        <View style={styles.badgeRow}>
          <UrgencyBadge
            label={label}
            color={badgeColor}
            softColor={badgeSoft}
            icon={
              product.status === 'consumed'
                ? 'check'
                : product.status === 'discarded'
                  ? 'delete-outline'
                  : 'clock-outline'
            }
          />
        </View>
        {showCategory ? (
          <AppText variant="caption" color={colors.textMuted} style={styles.category}>
            {getCategory(product.category).label}
          </AppText>
        ) : null}
      </View>

      {trailingText ? (
        <AppText variant="bodySmall" color={colors.textSecondary} style={styles.trailing}>
          {trailingText}
        </AppText>
      ) : null}

      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderLeftWidth: 5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  pressed: { opacity: 0.9 },
  content: { flex: 1, marginLeft: spacing.md },
  name: { flexShrink: 1 },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  category: { marginTop: 4 },
  trailing: { marginRight: spacing.sm },
});
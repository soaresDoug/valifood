import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ListRow } from '../components/ListRow';
import { UrgencyBadge } from '../components/ProductAvatar';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCategory, getUnitLabel } from '../constants/categories';
import { describeReminderFrequency } from '../constants/reminders';
import type { RootStackParamList } from '../navigation/types';
import { planRemindersForProduct } from '../services/notificationPlanner';
import { useProductStore } from '../store/useProductStore';
import { colors, radii, shadows, spacing, urgencyColors } from '../theme';
import {
  formatDateBR,
  formatDateTimeShort,
  formatExpirationLabel,
  getUrgencyLevel,
} from '../utils/dates';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

/**
 * Tela 7 do design: detalhes do alimento com as ações Consumir / Descartar
 * (ambas cancelam os lembretes pendentes — seção 5.4).
 */
export function ProductDetailsScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const products = useProductStore((state) => state.products);
  const markConsumed = useProductStore((state) => state.markConsumed);
  const markDiscarded = useProductStore((state) => state.markDiscarded);
  const removeProduct = useProductStore((state) => state.removeProduct);

  const product = useMemo(
    () => products.find((item) => item.id === productId) ?? null,
    [productId, products]
  );

  const schedule = useMemo(() => {
    if (!product) return null;
    const planned = planRemindersForProduct(product);
    const reminders = planned.filter((item) => item.kind === 'reminder');
    return {
      total: planned.length,
      next: reminders[0]?.date ?? null,
      last: reminders[reminders.length - 1]?.date ?? null,
    };
  }, [product]);

  if (!product) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Detalhes do alimento" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="package-variant-closed"
          title="Produto não encontrado"
          description="Este item pode ter sido excluído do seu estoque."
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  const category = getCategory(product.category);
  const urgency = urgencyColors[getUrgencyLevel(product.expirationDate)];
  const isClosed = product.status === 'consumed' || product.status === 'discarded';

  const confirmRemove = () => {
    Alert.alert(
      'Excluir produto',
      `Remover ${product.name}? Todos os lembretes pendentes serão cancelados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await removeProduct(product.id);
            navigation.goBack();
          },
        },
      ]
    );
  };
return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Detalhes do alimento"
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerActions}>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={20}
              color={colors.primary}
              onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
              style={styles.headerIcon}
            />
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color={colors.danger}
              onPress={confirmRemove}
            />
          </View>
        }
      />

      <View style={styles.card}>
        <View style={[styles.imageWrapper, { backgroundColor: category.color }]}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <MaterialCommunityIcons
              name={category.icon}
              size={32}
              color={colors.textOnPrimary}
            />
          )}
        </View>
        <View style={styles.cardContent}>
          <AppText variant="subtitle" numberOfLines={2}>
            {product.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {category.label}
          </AppText>
          <View style={styles.badgeRow}>
            <UrgencyBadge
              label={formatExpirationLabel(product.expirationDate)}
              color={isClosed ? colors.textSecondary : urgency.text}
              softColor={isClosed ? colors.surfaceMuted : urgency.soft}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <ListRow
          variant="info"
          icon="package-variant"
          label="Quantidade"
          value={`${product.quantity} ${getUnitLabel(product.unit)}`}
        />
        <ListRow
          variant="info"
          icon="calendar"
          label="Validade"
          value={formatDateBR(product.expirationDate)}
        />
        {product.barcode ? (
          <ListRow
            variant="info"
            icon="barcode-scan"
            label="Código de barras"
            value={product.barcode}
          />
        ) : null}
        <ListRow variant="info" icon={category.icon} label="Categoria" value={category.label} />
        <ListRow
          variant="info"
          icon="clock-outline"
          label="Frequência do lembrete"
          value={describeReminderFrequency(product.reminderFrequency, product.customIntervalDays)}
        />
        {!isClosed && schedule ? (
          <>
            <ListRow
              variant="info"
              icon="bell-ring-outline"
              label="Lembretes agendados"
              value={`${schedule.total}`}
            />
            <ListRow
              variant="info"
              icon={schedule.next ? 'bell-outline' : 'bell-off-outline'}
              label="Próximo lembrete"
              value={schedule.next ? formatDateTimeShort(schedule.next) : 'Nenhum'}
            />
          </>
        ) : null}
        {product.consumedAt ? (
          <ListRow
            variant="info"
            icon="check-circle-outline"
            label="Consumido em"
            value={formatDateTimeShort(product.consumedAt)}
          />
        ) : null}
        {product.discardedAt ? (
          <ListRow
            variant="info"
            icon="delete-outline"
            label="Descartado em"
            value={formatDateTimeShort(product.discardedAt)}
          />
        ) : null}
      </View>

      {!isClosed ? (
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Button
              label="Consumir"
              icon="check-circle-outline"
              onPress={async () => {
                await markConsumed(product.id);
                navigation.goBack();
              }}
            />
          </View>
          <View style={styles.actionItem}>
            <Button
              label="Descartar"
              variant="danger"
              icon="delete-outline"
              onPress={() => {
                Alert.alert(
                  'Descartar produto',
                  'Marcar como descartado? Os lembretes pendentes serão cancelados.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Descartar',
                      style: 'destructive',
                      onPress: async () => {
                        await markDiscarded(product.id);
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        </View>
      ) : (
        <AppText variant="caption" color={colors.textSecondary} center style={styles.closed}>
          Este item já saiu do estoque e não gera mais lembretes.
        </AppText>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginRight: spacing.lg },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  imageWrapper: {
    width: 84,
    height: 84,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 78, height: 78 },
  cardContent: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  badgeRow: { marginTop: spacing.sm },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  actionItem: { flex: 1 },
  closed: { marginTop: spacing.md },
});
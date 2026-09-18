import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ProductForm, type ProductFormValues } from '../components/ProductForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { getCategory } from '../constants/categories';
import type { RootStackParamList } from '../navigation/types';
import { cacheManualProduct } from '../services/productResolver';
import { useProductStore } from '../store/useProductStore';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductFound'>;

/**
 * Tela 6 do design: produto identificado pela API (nome/foto/marca) aguardando
 * a validade e a frequência do lembrete para ser salvo.
 */
export function ProductFoundScreen({ navigation, route }: Props) {
  const { resolved } = route.params;
  const addProduct = useProductStore((state) => state.addProduct);
  const category = getCategory(resolved.category);

  const handleSubmit = async (values: ProductFormValues) => {
    const product = await addProduct({
      ...values,
      barcode: values.barcode || resolved.barcode,
    });
    // Mantém o cache local aquecido para as próximas leituras (seção 3.3).
    cacheManualProduct(resolved.barcode, {
      name: values.name,
      imageUrl: values.imageUrl,
      category: values.category,
    });
    Alert.alert(
      'Produto salvo',
      `${product.name} cadastrado com ${product.notificationIds.length} ${
        product.notificationIds.length === 1 ? 'lembrete agendado' : 'lembretes agendados'
      }.`,
      [{ text: 'Ver estoque', onPress: () => navigation.navigate('Main') }]
    );
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Produto encontrado" onBack={() => navigation.goBack()} />

      <ProductForm
        initial={{
          barcode: resolved.barcode,
          name: resolved.name,
          imageUrl: resolved.imageUrl,
          source: resolved.source,
          category: resolved.category,
          quantity: 1,
          unit: 'un',
        }}
        brand={resolved.brand}
        onSubmit={handleSubmit}
        footerNote={`Fonte dos dados: ${
          resolved.source === 'openfoodfacts' ? 'Open Food Facts' : 'Cosmos Bluesoft'
        }`}
        header={
          <View style={styles.card}>
            <View style={styles.imageWrapper}>
              {resolved.imageUrl ? (
                <Image
                  source={{ uri: resolved.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <MaterialCommunityIcons
                  name={category.icon}
                  size={30}
                  color={colors.textOnPrimary}
                />
              )}
            </View>
            <View style={styles.cardContent}>
              <AppText variant="subtitle" numberOfLines={2}>
                {resolved.name}
              </AppText>
              {resolved.brand ? (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {resolved.brand}
                </AppText>
              ) : null}
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <AppText variant="tiny" color={colors.primary}>
                    {category.label}
                  </AppText>
                </View>
                {resolved.quantityLabel ? (
                  <View style={styles.chip}>
                    <AppText variant="tiny" color={colors.primary}>
                      {resolved.quantityLabel}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  imageWrapper: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 70, height: 70 },
  cardContent: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.successSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
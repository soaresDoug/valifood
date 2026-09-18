import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ProductForm, type ProductFormValues } from '../components/ProductForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { cacheManualProduct } from '../services/productResolver';
import { useProductStore } from '../store/useProductStore';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddProduct'>;

/**
 * Tela 4 do design: "Adicionar alimento" com o atalho de escanear o código de
 * barras ou preencher os dados manualmente.
 */
export function AddProductScreen({ navigation, route }: Props) {
  const barcode = route.params?.barcode;
  const addProduct = useProductStore((state) => state.addProduct);

  const handleSubmit = async (values: ProductFormValues) => {
    const product = await addProduct(values);
    if (values.barcode) {
      // Guarda o que o usuário digitou no cache para as próximas leituras.
      cacheManualProduct(values.barcode, {
        name: values.name,
        imageUrl: values.imageUrl,
        category: values.category,
      });
    }
    Alert.alert(
      'Alimento adicionado',
      `${product.name} entrou no seu estoque com ${
        product.notificationIds.length
      } ${product.notificationIds.length === 1 ? 'lembrete' : 'lembretes'} agendados.`,
      [{ text: 'Ok', onPress: () => navigation.navigate('Main') }]
    );
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Adicionar alimento"
        subtitle="Escaneie o código ou preencha os dados"
        onBack={() => navigation.goBack()}
      />

      <ProductForm
        initial={{
          barcode,
          name: '',
          source: 'manual',
          category: 'outros',
          quantity: 1,
          unit: 'un',
        }}
        editableBarcode
        onSubmit={handleSubmit}
        footerNote="Os lembretes são agendados no próprio aparelho, mesmo offline."
        header={
          <View style={styles.header}>
            <Button
              label="Escanear código de barras"
              icon="barcode-scan"
              onPress={() => navigation.navigate('Scanner')}
            />
            <View style={styles.divider}>
              <View style={styles.line} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.or}>
                ou
              </AppText>
              <View style={styles.line} />
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { marginHorizontal: spacing.md },
});
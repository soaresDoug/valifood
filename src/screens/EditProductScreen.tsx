import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { ProductForm, type ProductFormValues } from '../components/ProductForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { useProductStore } from '../store/useProductStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

/**
 * Edição da validade/frequência de um produto.
 * Ao salvar, os lembretes antigos são cancelados e reagendados do zero
 * (regra 5.4 da especificação).
 */
export function EditProductScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const products = useProductStore((state) => state.products);
  const updateProduct = useProductStore((state) => state.updateProduct);

  const product = useMemo(
    () => products.find((item) => item.id === productId) ?? null,
    [productId, products]
  );

  if (!product) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Editar alimento" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="package-variant-closed"
          title="Produto não encontrado"
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  const handleSubmit = async (values: ProductFormValues) => {
    const updated = await updateProduct(product.id, {
      name: values.name,
      imageUrl: values.imageUrl,
      category: values.category,
      quantity: values.quantity,
      unit: values.unit,
      expirationDate: values.expirationDate,
      reminderFrequency: values.reminderFrequency,
      customIntervalDays: values.customIntervalDays,
      // Reagenda do zero (regra 5.4).
      reschedule: true,
    });
    Alert.alert(
      'Alterações salvas',
      `${values.name} atualizado com ${
        updated?.notificationIds.length ?? 0
      } lembretes reagendados.`,
      [{ text: 'Ok', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Editar alimento"
        subtitle="Validade e frequência dos lembretes"
        onBack={() => navigation.goBack()}
      />
      <ProductForm
        initial={{
          barcode: product.barcode,
          name: product.name,
          imageUrl: product.imageUrl,
          source: product.source,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          expirationDate: product.expirationDate,
          reminderFrequency: product.reminderFrequency,
          customIntervalDays: product.customIntervalDays,
        }}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
        footerNote="Ao salvar, cancelamos os lembretes antigos e agendamos os novos."
      />
    </ScreenContainer>
  );
}
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { Banner } from '../components/Banner';
import { ProductForm, type ProductFormValues } from '../components/ProductForm';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { cacheManualProduct } from '../services/productResolver';
import { useProductStore } from '../store/useProductStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ManualProduct'>;

/**
 * Cadastro manual (seção 4.4): usado quando nenhuma API conhece o código.
 * É obrigatório no fluxo — nenhuma base cobre 100% dos produtos brasileiros.
 */
export function ManualProductScreen({ navigation, route }: Props) {
  const barcode = route.params?.barcode ?? '';
  const lookupFailed = route.params?.lookupFailed ?? false;
  const addProduct = useProductStore((state) => state.addProduct);

  const handleSubmit = async (values: ProductFormValues) => {
    const product = await addProduct(values);
    if (values.barcode) {
      cacheManualProduct(values.barcode, {
        name: values.name,
        imageUrl: values.imageUrl,
        category: values.category,
      });
    }
    Alert.alert(
      'Produto cadastrado',
      `${product.name} salvo com ${product.notificationIds.length} ${
        product.notificationIds.length === 1 ? 'lembrete' : 'lembretes'
      } agendados no aparelho.`,
      [{ text: 'Ok', onPress: () => navigation.navigate('Main') }]
    );
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Cadastro manual"
        subtitle="Complete os dados do produto"
        onBack={() => navigation.goBack()}
      />

      {lookupFailed ? (
        <Banner
          icon="magnify-close"
          tone="warning"
          title="Não encontramos esse código"
          description="As bases públicas não têm todos os produtos brasileiros. Preencha o nome e a foto para continuar — o código de barras já está preenchido."
        />
      ) : null}

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
        footerNote="Esse cadastro fica no cache local e acelera as próximas leituras do mesmo código."
      />
    </ScreenContainer>
  );
}
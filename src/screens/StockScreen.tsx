import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { ProductListItem } from '../components/ProductListItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { SearchBar } from '../components/SearchBar';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { getUnitLabel } from '../constants/categories';
import type { RootStackParamList } from '../navigation/types';
import { computeStats, useProductStore } from '../store/useProductStore';
import { colors, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'in_stock' | 'consumed' | 'discarded';

/**
 * Tela 8 do design: "Meu estoque" com busca, filtros e a quantidade à direita.
 */
export function StockScreen() {
  const navigation = useNavigation<Nav>();
  const products = useProductStore((state) => state.products);
  const reload = useProductStore((state) => state.reload);
  const markConsumed = useProductStore((state) => state.markConsumed);
  const markDiscarded = useProductStore((state) => state.markDiscarded);
  const removeProduct = useProductStore((state) => state.removeProduct);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => reload(), [reload]));

  const stats = useMemo(() => computeStats(products), [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) => {
        if (filter === 'in_stock') {
          return product.status === 'active' || product.status === 'expired';
        }
        if (filter === 'consumed') return product.status === 'consumed';
        if (filter === 'discarded') return product.status === 'discarded';
        return true;
      })
      .filter((product) =>
        term.length === 0
          ? true
          : product.name.toLowerCase().includes(term) ||
            product.barcode.includes(term)
      )
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  }, [filter, products, search]);

  const openOptions = (productId: string, name: string) => {
    Alert.alert(name, 'O que deseja fazer?', [
      {
        text: 'Marcar como consumido',
        onPress: () => void markConsumed(productId),
      },
      {
        text: 'Marcar como descartado',
        onPress: () => void markDiscarded(productId),
      },
      {
        text: 'Excluir definitivamente',
        style: 'destructive',
        onPress: () => void removeProduct(productId),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <ScreenContainer noPadding>
      <View style={styles.header}>
        <AppText variant="title">Meu estoque</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {stats.active} em estoque • {stats.expired} vencidos • {stats.consumed} consumidos
        </AppText>
        <View style={styles.searchWrapper}>
          <SearchBar value={search} onChangeText={setSearch} onFilterPress={() => setFilter('in_stock')} />
        </View>
        <SegmentedTabs
          value={filter}
          onChange={setFilter}
          scrollable
          options={[
            { value: 'all', label: 'Todos', count: products.length },
            { value: 'in_stock', label: 'Em estoque', count: stats.active + stats.expired },
            { value: 'consumed', label: 'Consumidos', count: stats.consumed },
            { value: 'discarded', label: 'Descartados', count: stats.discarded },
          ]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductListItem
            product={item}
            showCategory
            trailingText={`${item.quantity} ${getUnitLabel(item.unit)}`}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
            onLongPress={() => openOptions(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant"
            title={search ? 'Nada encontrado' : 'Estoque vazio neste filtro'}
            description={
              search
                ? 'Tente outro nome ou código de barras.'
                : 'Adicione alimentos para acompanhar as validades.'
            }
            actionLabel={search ? undefined : 'Adicionar alimento'}
            onAction={search ? undefined : () => navigation.navigate('AddProduct')}
          />
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <AppText variant="caption" color={colors.textMuted} center style={styles.footer}>
              Toque em um item para ver os detalhes. Pressione e segure para mais ações.
            </AppText>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchWrapper: { marginTop: spacing.md },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  footer: { marginTop: spacing.sm },
});
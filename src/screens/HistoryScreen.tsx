import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { ProductListItem } from '../components/ProductListItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { SegmentedTabs } from '../components/SegmentedTabs';
import type { RootStackParamList } from '../navigation/types';
import { computeStats, useProductStore } from '../store/useProductStore';
import { colors, spacing } from '../theme';
import type { Product } from '../types';
import { formatDayGroup } from '../utils/dates';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'consumed' | 'discarded';

interface HistorySection {
  title: string;
  data: Product[];
}

/**
 * Tela 9 do design: histórico agrupado por dia (Hoje / Ontem / data), com as
 * abas Consumidos e Descartados.
 */
export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const products = useProductStore((state) => state.products);
  const reload = useProductStore((state) => state.reload);
  const [filter, setFilter] = useState<Filter>('consumed');

  useFocusEffect(useCallback(() => reload(), [reload]));

  const stats = useMemo(() => computeStats(products), [products]);

  const sections = useMemo<HistorySection[]>(() => {
    const filtered = products
      .filter((product) => product.status === filter)
      .sort((a, b) => {
        const aDate = a.consumedAt ?? a.discardedAt ?? a.createdAt;
        const bDate = b.consumedAt ?? b.discardedAt ?? b.createdAt;
        return bDate.localeCompare(aDate);
      });

    const groups = new Map<string, Product[]>();
    for (const product of filtered) {
      const key = formatDayGroup(product.consumedAt ?? product.discardedAt ?? product.createdAt);
      const current = groups.get(key) ?? [];
      current.push(product);
      groups.set(key, current);
    }
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [filter, products]);

  return (
    <ScreenContainer noPadding>
      <View style={styles.header}>
        <AppText variant="title">Histórico</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          O que você consumiu ou descartou — e o quanto isso evitou de desperdício.
        </AppText>
        <View style={styles.tabs}>
          <SegmentedTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'consumed', label: 'Consumidos', count: stats.consumed },
              { value: 'discarded', label: 'Descartados', count: stats.discarded },
            ]}
          />
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <AppText variant="subtitle" style={styles.sectionTitle}>
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => (
          <ProductListItem
            product={item}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="Nada por aqui ainda"
            description={
              filter === 'consumed'
                ? 'Quando você marcar um produto como consumido ele aparece neste histórico.'
                : 'Produtos descartados ficam registrados aqui para você acompanhar o desperdício.'
            }
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  tabs: { marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
});
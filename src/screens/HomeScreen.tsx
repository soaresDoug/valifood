import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ProductListItem } from '../components/ProductListItem';
import { ScreenContainer } from '../components/ScreenContainer';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useProductStore, computeStats, selectInStock } from '../store/useProductStore';
import { selectGreetingName, useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tabs = BottomTabNavigationProp<MainTabParamList>;

/**
 * Tela 3 do design: "Olá, {nome}!" + o que consumir primeiro (ordenado pela
 * validade mais próxima) + botão único de adicionar produto.
 */
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const tabs = useNavigation<Tabs>();
  const products = useProductStore((state) => state.products);
  const reconcileExpired = useProductStore((state) => state.reconcileExpired);
  const reload = useProductStore((state) => state.reload);
  const profile = useSettingsStore((state) => state.profile);
  const greeting = useSettingsStore(selectGreetingName);
  const notificationsGranted = useSettingsStore((state) => state.notificationsGranted);
  const askNotificationPermission = useSettingsStore(
    (state) => state.askNotificationPermission
  );
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Ao voltar para a Home, revalida vencidos e recarrega a lista do SQLite.
  useFocusEffect(
    useCallback(() => {
      reconcileExpired();
      reload();
    }, [reconcileExpired, reload])
  );

  const inStock = useMemo(() => selectInStock(products), [products]);
  const stats = useMemo(() => computeStats(products), [products]);
  const urgent = inStock.slice(0, 5);

  // CTA única de "Adicionar produto" (com a dica logo abaixo): fica dentro do bloco
  // centralizado quando a despensa está vazia e no rodapé da lista quando há itens.
  const addProductCta = (
    <>
      <Button
        label="Adicionar produto"
        icon="plus"
        onPress={() => navigation.navigate('AddProduct')}
        style={styles.cta}
      />
      <AppText variant="caption" color={colors.textSecondary} center style={styles.ctaHint}>
        Escaneie o código de barras para adicionar produtos e receber alertas de vencimento.
      </AppText>
    </>
  );

  return (
    <ScreenContainer scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText variant="title">Olá, {greeting}!</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {stats.expiringSoon > 0
              ? `${stats.expiringSoon} ${stats.expiringSoon === 1 ? 'item vence' : 'itens vencem'} nos próximos 7 dias`
              : 'Nada vencendo nos próximos 7 dias'}
          </AppText>
        </View>
        <Pressable
          onPress={() => navigation.navigate('SideMenu')}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          style={styles.avatar}
        >
          {profile ? (
            <AppText variant="subtitle" color={colors.textOnPrimary}>
              {profile.name.charAt(0).toUpperCase()}
            </AppText>
          ) : (
            <MaterialCommunityIcons name="account" size={22} color={colors.textOnPrimary} />
          )}
        </Pressable>
      </View>

      {!notificationsGranted && !bannerDismissed ? (
        <Banner
          icon="bell-ring-outline"
          tone="warning"
          title="Ative as notificações"
          description="Sem permissão o ValiFood não consegue avisar antes do produto vencer."
          actionLabel="Ativar agora"
          onAction={async () => {
            const granted = await askNotificationPermission();
            if (granted) setBannerDismissed(true);
          }}
          onClose={() => setBannerDismissed(true)}
        />
      ) : null}

      <AppText variant="subtitle" style={styles.sectionTitle}>
        O que consumir primeiro?
      </AppText>

      {urgent.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="cart-outline"
            title="Sua despensa está vazia"
            description="Adicione seu primeiro produto para começar a receber os alertas de vencimento."
          />
          {addProductCta}
        </View>
      ) : (
        <>
          {urgent.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
            />
          ))}

          {inStock.length > urgent.length ? (
            <Pressable
              onPress={() => tabs.navigate('Stock')}
              style={styles.seeAll}
              accessibilityRole="button"
            >
              <AppText variant="label" color={colors.primary}>
                Ver todos os {inStock.length} itens do estoque
              </AppText>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
            </Pressable>
          ) : null}

          {addProductCta}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  /**
   * O `ScreenContainer` rola a tela; deixar o conteúdo interno crescer (`flexGrow`)
   * garante altura definida para o estado vazio centralizar de verdade.
   */
  content: { flexGrow: 1 },
  /**
   * Estado vazio (sem produtos): o conjunto ícone + texto + CTA fica centralizado
   * no espaço livre abaixo do título da seção.
   */
  emptyWrapper: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: { flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { marginBottom: spacing.md },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  cta: { marginTop: spacing.lg },
  ctaHint: { marginTop: spacing.sm },
});
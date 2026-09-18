import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef, openProductFromNotification } from './src/navigation/navigationRef';
import { RootNavigator } from './src/navigation/RootNavigator';
import {
  addNotificationTapListener,
  configureNotificationHandler,
  getInitialNotificationProductId,
  setupAndroidChannel,
} from './src/services/notifications';
import { useProductStore } from './src/store/useProductStore';
import { colors } from './src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const appState = useRef(AppState.currentState);

  // Handler de notificação + canal Android (seção 5.2).
  useEffect(() => {
    configureNotificationHandler();
    void setupAndroidChannel();
  }, []);

  // Toque na notificação abre os detalhes do produto (seção 5.3), inclusive em
  // cold start.
  useEffect(() => {
    const subscription = addNotificationTapListener((productId) => {
      if (productId) openProductFromNotification(productId);
    });
    void getInitialNotificationProductId().then((productId) => {
      if (productId) {
        // Aguarda o container de navegação montar antes de navegar.
        setTimeout(() => openProductFromNotification(productId), 800);
      }
    });
    return () => subscription?.remove();
  }, []);

  // Ao voltar do background, revalida vencidos e reconstrói a agenda.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appState.current !== 'active';
      appState.current = nextState;
      if (nextState === 'active' && wasBackground) {
        const store = useProductStore.getState();
        if (store.hydrated) {
          store.reconcileExpired();
          void store.refreshSchedules();
        }
      }
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    // Enquanto a fonte Inter carrega, mantém o fundo da marca (sem "flash").
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.surface },
});

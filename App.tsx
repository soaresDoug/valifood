import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
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

/**
 * Splash nativo: mantido visivel ate a fonte Inter e a primeira tela do app
 * estarem prontas. Assim a troca para a splash do app e imperceptivel
 * (sem "flash" de tela branca) — tarefa 2 da especificacao.
 */
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const appState = useRef(AppState.currentState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) setReady(true);
  }, [fontsLoaded]);

  const handleRootLayout = useCallback(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

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

  if (!ready) {
    // Splash nativo ainda visivel: nao renderizamos nada para nao piscar branco.
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={handleRootLayout}>
        <NavigationContainer ref={navigationRef} theme={navigationTheme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { LeafDecor } from '../components/LeafDecor';
import { Logo } from '../components/Logo';
import type { RootStackParamList } from '../navigation/types';
import { configureNotificationHandler, setupAndroidChannel } from '../services/notifications';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, spacing } from '../theme';
import {
  MIN_SPLASH_DURATION_MS,
  SPLASH_FADE_DURATION_MS,
  resolveStartRoute,
} from '../utils/appFlow';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tela de abertura (design tela 1 + tarefa 2 da especificacao):
 * logo centralizada por ~2s, bootstrap do app em paralelo e transicao por
 * fade-out (350ms) para a proxima tela — sem flash de tela branca.
 *
 * O splash nativo do sistema (app.json) permanece visivel enquanto as fontes
 * carregam, e so e escondido quando este componente ja esta montado, de modo
 * que o usuario nunca ve uma tela vazia.
 */
export function SplashScreen({ navigation }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(0.1)).current;
  const [message, setMessage] = useState('Carregando...');
  const hydrateProducts = useProductStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const startedAt = useRef(Date.now());

  const bootstrap = useCallback(async () => {
    // A animacao do logo roda junto com o carregamento dos dados.
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 0.85,
        duration: MIN_SPLASH_DURATION_MS - SPLASH_FADE_DURATION_MS,
        useNativeDriver: false,
      }),
    ]).start();

    try {
      setMessage('Carregando seus dados...');
      hydrateSettings();
      configureNotificationHandler();
      await setupAndroidChannel();
      setMessage('Organizando seus lembretes...');
      await hydrateProducts();
    } catch (error) {
      console.warn('[splash] falha no bootstrap', error);
    }

    // Garante o tempo minimo em tela (~2s no total).
    const elapsed = Date.now() - startedAt.current;
    if (elapsed < MIN_SPLASH_DURATION_MS) {
      await wait(MIN_SPLASH_DURATION_MS - elapsed);
    }

    Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: false }).start();

    // Fade-out do conteudo antes de trocar de tela (transicao suave).
    await new Promise<void>((resolve) => {
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => resolve());
    });

    const profile = useSettingsStore.getState().profile;
    const route = resolveStartRoute(Boolean(profile));
    setMessage(route === 'Main' ? 'Bem-vindo de volta!' : 'Mais controle. Menos desperdício.');
    navigation.replace(route);
  }, [
    contentOpacity,
    hydrateProducts,
    hydrateSettings,
    logoOpacity,
    logoScale,
    navigation,
    progress,
  ]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Logo size={112} wordmarkSize={38} />
        </Animated.View>
        <AppText variant="body" color={colors.textSecondary} center style={styles.tagline}>
          Mais controle.{'\n'}Menos desperdício.
        </AppText>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width: barWidth }]} />
        </View>
        <AppText variant="caption" color={colors.textSecondary} center style={styles.loading}>
          {message}
        </AppText>
      </Animated.View>

      <LeafDecor opacity={0.55} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Mesma cor do splash nativo (app.json) para a troca ser imperceptivel.
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: { marginTop: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  bar: { height: 6, borderRadius: radii.pill, backgroundColor: colors.primary },
  loading: { marginTop: spacing.sm },
});
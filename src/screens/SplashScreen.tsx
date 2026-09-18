import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { LeafDecor } from '../components/LeafDecor';
import { Logo } from '../components/Logo';
import { ScreenContainer } from '../components/ScreenContainer';
import type { RootStackParamList } from '../navigation/types';
import { configureNotificationHandler, setupAndroidChannel } from '../services/notifications';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

/**
 * Tela 1 do design: logo, tagline, barra de progresso e "Carregando...".
 * Enquanto aparece, faz o bootstrap do app: banco local, ajustes e agenda de
 * notificações (garante que os lembretes sejam reconstruídos a cada abertura).
 */
export function SplashScreen({ navigation }: Props) {
  const progress = useRef(new Animated.Value(0.08)).current;
  const [message, setMessage] = useState('Carregando...');
  const hydrateProducts = useProductStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  const bootstrap = useCallback(async () => {
    try {
      setMessage('Carregando dados locais...');
      hydrateSettings();
      configureNotificationHandler();
      await setupAndroidChannel();
      setMessage('Organizando seus lembretes...');
      await hydrateProducts();
    } catch (error) {
      console.warn('[splash] falha no bootstrap', error);
    } finally {
      Animated.timing(progress, {
        toValue: 1,
        duration: 320,
        useNativeDriver: false,
      }).start();
      const profile = useSettingsStore.getState().profile;
      setMessage(profile ? 'Bem-vindo de volta!' : 'Mais controle. Menos desperdício.');
      setTimeout(() => {
        navigation.replace(profile ? 'Main' : 'Login');
      }, 420);
    }
  }, [hydrateProducts, hydrateSettings, navigation, progress]);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 0.75,
      duration: 900,
      useNativeDriver: false,
    });
    animation.start();
    void bootstrap();
    return () => animation.stop();
  }, [bootstrap, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ScreenContainer backgroundColor={colors.surface}>
      <View style={styles.content}>
        <Logo size={110} wordmarkSize={38} />
        <AppText variant="body" color={colors.textSecondary} center style={styles.tagline}>
          Mais controle.{'\n'}Menos desperdício.
        </AppText>
      </View>

      <View style={styles.footer}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, { width }]} />
        </View>
        <AppText variant="caption" color={colors.textSecondary} center style={styles.loading}>
          {message}
        </AppText>
      </View>

      <LeafDecor opacity={0.55} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: { marginTop: spacing.lg },
  footer: { paddingBottom: spacing.xxl },
  track: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  bar: { height: 6, borderRadius: radii.pill, backgroundColor: colors.primary },
  loading: { marginTop: spacing.sm },
});
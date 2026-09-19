import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { LeafDecor } from '../components/LeafDecor';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

interface Slide {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
}

/**
 * Slides curtos (leitura total < 30s), conforme a tarefa 3:
 * swipe ou botao "Proximo", indicador de progresso e "Pular" sempre visivel.
 */
const SLIDES: Slide[] = [
  {
    key: 'scan',
    icon: 'barcode-scan',
    title: 'Escaneie o código de barras',
    description: 'Aponte a câmera e o produto é identificado automaticamente.',
  },
  {
    key: 'expiration',
    icon: 'calendar-month',
    title: 'Informe a validade',
    description: 'Escolha a data de vencimento e a frequência dos lembretes.',
  },
  {
    key: 'reminders',
    icon: 'bell-ring-outline',
    title: 'Receba o aviso a tempo',
    description: 'Lembretes no celular antes de vencer — funciona offline.',
  },
  {
    key: 'waste',
    icon: 'leaf',
    title: 'Menos desperdício',
    description: 'Veja o que você consumiu e quanto deixou de jogar fora.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);

  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex((current) => current + 1);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, next)));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <AppText variant="label" color={colors.primary}>
          ValiFood
        </AppText>
        <Pressable
          onPress={finish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Pular introdução"
        >
          <AppText variant="label" color={colors.textSecondary}>
            Pular
          </AppText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, itemIndex) => ({
          length: width,
          offset: width * itemIndex,
          index: itemIndex,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={item.icon} size={44} color={colors.primary} />
            </View>
            <AppText variant="title" center style={styles.title}>
              {item.title}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} center style={styles.description}>
              {item.description}
            </AppText>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityRole="progressbar">
          {SLIDES.map((slide, dotIndex) => (
            <View
              key={slide.key}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          label={isLast ? 'Começar a usar' : 'Próximo'}
          icon={isLast ? 'check' : 'arrow-right'}
          iconPosition={isLast ? 'left' : 'right'}
          onPress={goNext}
        />
      </View>

      <LeafDecor opacity={0.25} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: radii.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { marginBottom: spacing.sm },
  description: { maxWidth: 300 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  dotActive: { width: 24, backgroundColor: colors.primary },
});
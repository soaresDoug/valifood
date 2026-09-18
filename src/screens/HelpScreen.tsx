import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

interface FaqItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  question: string;
  answer: string;
}

const FAQ: FaqItem[] = [
  {
    icon: 'barcode-scan',
    question: 'O código de barras não foi reconhecido. O que faço?',
    answer:
      'Você será levado ao cadastro manual com o código já preenchido: basta digitar o nome, escolher a categoria e informar a validade. Nas próximas leituras o app usa o cache local e preenche automaticamente.',
  },
  {
    icon: 'bell-ring-outline',
    question: 'Por que não recebi nenhum lembrete?',
    answer:
      'Verifique se as notificações estão permitidas em Notificações. Depois use "Reagendar todos os lembretes": o app recalcula a agenda a partir da validade de cada produto.',
  },
  {
    icon: 'clock-outline',
    question: 'Com que antecedência o app avisa?',
    answer:
      'Você escolhe no cadastro: a cada dia, a cada 3 dias, semanalmente, apenas 1 dia antes ou um intervalo personalizado. Os lembretes são contados retroativamente a partir da data de validade e nunca passam dela.',
  },
  {
    icon: 'wifi-off',
    question: 'O app funciona sem internet?',
    answer:
      'Sim. A única etapa que precisa de rede é a consulta do código de barras. Cadastro, estoque, histórico e lembretes funcionam 100% offline.',
  },
  {
    icon: 'delete-outline',
    question: 'Como cancelo os lembretes de um produto?',
    answer:
      'Marque o item como Consumido ou Descartado (ou exclua o produto). Todas as notificações pendentes daquele item são canceladas na hora.',
  },
];

/** Central de ajuda com as dúvidas mais frequentes do fluxo. */
export function HelpScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Ajuda"
        subtitle="Como o ValiFood funciona"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.flow}>
        <AppText variant="label" color={colors.textOnPrimary}>
          Escanear → identificar → informar validade → ser lembrado
        </AppText>
      </View>
      {FAQ.map((item) => (
        <View key={item.question} style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
            <AppText variant="label" style={styles.question}>
              {item.question}
            </AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary}>
            {item.answer}
          </AppText>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flow: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  question: { flex: 1, marginLeft: spacing.sm },
});
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

interface Section {
  title: string;
  paragraphs: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Onde ficam seus dados',
    paragraphs: [
      'O ValiFood v1 é local-first: produtos, validades, histórico e lembretes ficam apenas no banco SQLite do seu aparelho.',
      'Não existe servidor do ValiFood, não existe conta na nuvem e nenhum dado seu é enviado para nós.',
    ],
  },
  {
    title: 'Quando o app usa a internet',
    paragraphs: [
      'Somente ao ler um código de barras desconhecido: enviamos o número do código para o Open Food Facts (e, se configurado, para o Cosmos Bluesoft) para descobrir o nome e a foto do produto.',
      'Se estiver offline, o app continua funcionando e usa o cadastro manual.',
    ],
  },
  {
    title: 'Permissões usadas',
    paragraphs: [
      'Câmera: exclusivamente para ler o código de barras e, opcionalmente, fotografar o produto no cadastro manual.',
      'Notificações: para agendar os lembretes de validade no próprio sistema operacional.',
      'Galeria: apenas quando você escolhe uma foto para o produto.',
    ],
  },
  {
    title: 'Como apagar tudo',
    paragraphs: [
      'Em Configurações → Limpar todo o estoque você remove os produtos e cancela todos os lembretes pendentes.',
      'Desinstalar o app também elimina definitivamente o banco local, já que não há cópia em servidor.',
    ],
  },
];

/** Política de privacidade (LGPD) e transparência sobre o uso de dados. */
export function PrivacyScreen({ navigation }: Props) {
  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Privacidade"
        subtitle="Seus dados ficam com você"
        onBack={() => navigation.goBack()}
      />
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <AppText variant="subtitle" style={styles.cardTitle}>
            {section.title}
          </AppText>
          {section.paragraphs.map((paragraph) => (
            <AppText
              key={paragraph}
              variant="body"
              color={colors.textSecondary}
              style={styles.paragraph}
            >
              {paragraph}
            </AppText>
          ))}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: { marginBottom: spacing.sm },
  paragraph: { marginBottom: spacing.sm },
});
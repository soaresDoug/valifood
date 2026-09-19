import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { LeafDecor } from '../components/LeafDecor';
import { Logo } from '../components/Logo';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, spacing } from '../theme';
import { isValidUserName, normalizeUserName, resolvePostLoginRoute } from '../utils/appFlow';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Tela 2 do design, simplificada conforme a especificacao:
 * apenas o nome do usuario + botao "Continuar" (sem senha, sem criacao de
 * conta, sem login social). O nome e salvo localmente para reconhecer o
 * usuario nas proximas sessoes.
 */
export function LoginScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const signIn = useSettingsStore((state) => state.signIn);
  const onboardingDone = useSettingsStore((state) => state.settings.onboardingDone);

  const trimmed = normalizeUserName(name);
  const isBlank = trimmed.length === 0;

  // Erro em tempo real quando o usuario digita apenas espacos.
  const visibleError = error ?? (name.length > 0 && isBlank ? 'Digite seu nome para continuar' : null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError(null);
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!isValidUserName(name)) {
      setError(isBlank ? 'Informe seu nome para continuar' : 'Digite pelo menos 2 letras');
      return;
    }

    setSaving(true);
    try {
      await signIn(trimmed);
      // Onboarding apenas na primeira vez que o nome é informado.
      navigation.reset({
        index: 0,
        routes: [{ name: resolvePostLoginRoute(onboardingDone) }],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scroll backgroundColor={colors.surface}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size={92} wordmarkSize={34} />
          <AppText variant="body" color={colors.textSecondary} center style={styles.tagline}>
            Mais controle.{'\n'}Menos desperdício.
          </AppText>
        </View>

        <View style={styles.form}>
          <AppText variant="subtitle" center style={styles.question}>
            Como podemos te chamar?
          </AppText>
          <TextField
            label="Seu nome"
            icon="account-outline"
            placeholder="Digite seu nome"
            value={name}
            onChangeText={handleNameChange}
            error={visibleError}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={40}
            onSubmitEditing={handleContinue}
            hint="Usamos o nome apenas para personalizar o app neste aparelho."
          />

          <Button
            label="Continuar"
            icon="arrow-right"
            onPress={handleContinue}
            loading={saving}
            disabled={isBlank}
          />
        </View>
      </View>

      <LeafDecor opacity={0.4} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', paddingBottom: spacing.xxl },
  tagline: { marginTop: spacing.md },
  form: { marginBottom: spacing.xxl },
  question: { marginBottom: spacing.lg },
});
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { LeafDecor } from '../components/LeafDecor';
import { Logo } from '../components/Logo';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Tela 2 do design: login/cadastro. Na v1 (local-first, seção 1.3) a "conta" é
 * um perfil salvo no próprio aparelho — nenhum dado vai para servidor.
 */
export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const signIn = useSettingsStore((state) => state.signIn);

  const handleSignIn = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    if (!isEmail(email)) nextErrors.email = 'Informe um e-mail válido';
    if (password.trim().length < 4) nextErrors.password = 'Mínimo de 4 caracteres';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const name = email.split('@')[0].replace(/[._-]+/g, ' ');
      await signIn(name.charAt(0).toUpperCase() + name.slice(1), email);
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider: string) => {
    Alert.alert(
      `${provider} indisponível na v1`,
      'O ValiFood v1 funciona 100% offline, sem backend. O login social entra no roadmap junto da sincronização entre dispositivos. Crie uma conta local para continuar.',
      [{ text: 'Entendi' }]
    );
  };

  return (
    <ScreenContainer scroll backgroundColor={colors.surface}>
      <View style={styles.header}>
        <Logo size={86} wordmarkSize={32} />
        <AppText variant="body" color={colors.textSecondary} center style={styles.tagline}>
          Mais controle.{'\n'}Menos desperdício.
        </AppText>
      </View>

      <TextField
        label="E-mail"
        icon="email-outline"
        placeholder="ana@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label="Senha"
        icon="lock-outline"
        placeholder="••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <Button label="Entrar" onPress={handleSignIn} loading={loading} />

      <View style={styles.spacer} />
      <Button
        label="Criar conta"
        variant="outline"
        onPress={() => navigation.navigate('SignUp')}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.dividerText}>
          ou
        </AppText>
        <View style={styles.line} />
      </View>

      <Button
        label="Continuar com Google"
        variant="outline"
        icon="google"
        onPress={() => handleSocial('Google')}
      />
      <View style={styles.spacerXs} />
      <Button
        label="Continuar com Apple"
        variant="outline"
        icon="apple"
        onPress={() => handleSocial('Apple')}
      />

      <View style={styles.bottom}>
        <AppText variant="body" color={colors.textSecondary}>
          Já tem uma conta?{' '}
        </AppText>
        <Pressable onPress={handleSignIn} hitSlop={8}>
          <AppText variant="label" color={colors.primary}>
            Entrar
          </AppText>
        </Pressable>
      </View>

      <LeafDecor opacity={0.4} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xl },
  tagline: { marginTop: spacing.md },
  spacer: { height: spacing.md },
  spacerXs: { height: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.md },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { LeafDecor } from '../components/LeafDecor';
import { Logo } from '../components/Logo';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Cadastro da conta local (tela 2 do design, aba "Criar conta"). */
export function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const signIn = useSettingsStore((state) => state.signIn);

  const handleSubmit = async () => {
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = 'Informe seu nome';
    if (!isEmail(email)) nextErrors.email = 'Informe um e-mail válido';
    if (password.trim().length < 4) nextErrors.password = 'Mínimo de 4 caracteres';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      // A permissão de notificação é pedida aqui, com contexto (seção 5.2).
      await signIn(name, email);
      navigation.replace('Main');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll backgroundColor={colors.surface}>
      <View style={styles.header}>
        <Logo size={64} wordmarkSize={26} />
      </View>

      <ScreenHeader title="Criar conta" subtitle="Leva menos de um minuto" onBack={() => navigation.goBack()} />

      <Banner
        icon="shield-lock-outline"
        title="Seus dados ficam no aparelho"
        description="Na v1 o ValiFood não tem servidor: tudo é salvo localmente no seu celular."
      />

      <TextField
        label="Nome"
        icon="account-outline"
        placeholder="Ana Silva"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
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
        hint="A senha não é armazenada: a conta é local nesta versão."
      />

      <Button label="Criar conta e continuar" onPress={handleSubmit} loading={loading} />
      <AppText variant="caption" color={colors.textSecondary} center style={styles.terms}>
        Ao continuar você autoriza o ValiFood a agendar notificações locais de validade
        neste aparelho.
      </AppText>

      <LeafDecor opacity={0.3} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.md },
  terms: { marginTop: spacing.md, paddingBottom: spacing.xxl },
});
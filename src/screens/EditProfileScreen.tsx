import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '../components/Button';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { TextField } from '../components/TextField';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

/**
 * Edição do perfil local: nome obrigatório, e-mail opcional
 * (o login atual pede apenas o nome).
 */
export function EditProfileScreen({ navigation }: Props) {
  const profile = useSettingsStore((state) => state.profile);
  const updateProfile = useSettingsStore((state) => state.updateProfile);
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const handleSave = () => {
    const nextErrors: { name?: string; email?: string } = {};
    if (name.trim().length < 2) nextErrors.name = 'Informe seu nome';
    if (email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Informe um e-mail válido ou deixe em branco';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile({ name: name.trim(), email: email.trim().toLowerCase() });
    Alert.alert('Perfil atualizado', 'Seus dados foram salvos no aparelho.', [
      { text: 'Ok', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Editar perfil" onBack={() => navigation.goBack()} />
      <TextField
        label="Nome"
        icon="account-outline"
        value={name}
        onChangeText={setName}
        error={errors.name}
      />
      <TextField
        label="E-mail (opcional)"
        icon="email-outline"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="voce@email.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <Button label="Salvar" onPress={handleSave} />
    </ScreenContainer>
  );
}
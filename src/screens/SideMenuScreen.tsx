import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { SideDrawer, type DrawerItem } from '../components/SideDrawer';
import type { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/useSettingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SideMenu'>;

/**
 * Tela 12 do design: menu lateral. Implementado como modal transparente para
 * não depender de `@react-navigation/drawer` (e do Reanimated).
 */
export function SideMenuScreen({ navigation }: Props) {
  const profile = useSettingsStore((state) => state.profile);
  const signOut = useSettingsStore((state) => state.signOut);

  const go = (action: () => void) => {
    navigation.goBack();
    // Pequeno atraso para a animação de saída do menu não competir com a nova tela.
    setTimeout(action, 180);
  };

  const items: DrawerItem[] = [
    {
      key: 'home',
      label: 'Início',
      icon: 'home-variant',
      onPress: () => go(() => navigation.navigate('Main', { screen: 'Home' })),
    },
    {
      key: 'stock',
      label: 'Estoque',
      icon: 'package-variant',
      onPress: () => go(() => navigation.navigate('Main', { screen: 'Stock' })),
    },
    {
      key: 'history',
      label: 'Histórico',
      icon: 'history',
      onPress: () => go(() => navigation.navigate('Main', { screen: 'History' })),
    },
    {
      key: 'profile',
      label: 'Perfil',
      icon: 'account-outline',
      onPress: () => go(() => navigation.navigate('Profile')),
    },
    {
      key: 'notifications',
      label: 'Notificações',
      icon: 'bell-outline',
      onPress: () => go(() => navigation.navigate('NotificationSettings')),
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: 'cog-outline',
      onPress: () => go(() => navigation.navigate('Settings')),
    },
    {
      key: 'help',
      label: 'Ajuda',
      icon: 'help-circle-outline',
      onPress: () => go(() => navigation.navigate('Help')),
    },
    {
      key: 'signout',
      label: 'Sair da conta',
      icon: 'logout',
      destructive: true,
      onPress: () =>
        go(() => {
          Alert.alert('Sair da conta', 'Seus produtos continuam salvos neste aparelho.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Sair',
              style: 'destructive',
              onPress: () => {
                signOut();
                navigation.navigate('Login');
              },
            },
          ]);
        }),
    },
  ];

  return (
    <SideDrawer
      items={items}
      onClose={() => navigation.goBack()}
      userName={profile?.name}
      userEmail={profile?.email ? profile.email : undefined}
    />
  );
}
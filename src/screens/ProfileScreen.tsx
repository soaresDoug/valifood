import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { ListRow } from '../components/ListRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { computeStats, useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

/** Tela 10 do design: perfil do usuário com atalhos de configuração. */
export function ProfileScreen({ navigation }: Props) {
  const profile = useSettingsStore((state) => state.profile);
  const signOut = useSettingsStore((state) => state.signOut);
  const notificationsGranted = useSettingsStore((state) => state.notificationsGranted);
  const products = useProductStore((state) => state.products);
  const stats = useMemo(() => computeStats(products), [products]);

  if (!profile) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Perfil" onBack={() => navigation.navigate('Main')} />
        <Banner
          icon="account-outline"
          tone="warning"
          title="Nenhuma conta local"
          description="Entre para começar a acompanhar as validades."
          actionLabel="Entrar"
          onAction={() => navigation.navigate('Login')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Perfil"
        onBack={() => navigation.navigate('Main')}
        right={
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={colors.textSecondary}
            onPress={() => navigation.navigate('Settings')}
          />
        }
      />

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <AppText variant="title" color={colors.textOnPrimary}>
            {profile.name.charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.identityText}>
          <AppText variant="subtitle">{profile.name}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {profile.email}
          </AppText>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <AppText variant="title" color={colors.primary}>
            {stats.active + stats.expired}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            em estoque
          </AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AppText variant="title" color={colors.primary}>
            {stats.consumed}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            consumidos
          </AppText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AppText variant="title" color={colors.danger}>
            {stats.discarded}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            descartados
          </AppText>
        </View>
      </View>

      {!notificationsGranted ? (
        <Banner
          icon="bell-off-outline"
          tone="warning"
          title="Notificações desativadas"
          description="Sem permissão o app não consegue avisar antes do vencimento."
          actionLabel="Configurar"
          onAction={() => navigation.navigate('NotificationSettings')}
        />
      ) : null}

      <View style={styles.menu}>
        <ListRow
          icon="account-outline"
          label="Editar perfil"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <ListRow
          icon="bell-outline"
          label="Notificações"
          value={notificationsGranted ? 'Ativas' : 'Desativadas'}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <ListRow
          icon="cog-outline"
          label="Configurações"
          onPress={() => navigation.navigate('Settings')}
        />
        <ListRow
          icon="shield-lock-outline"
          label="Privacidade"
          onPress={() => navigation.navigate('Privacy')}
        />
        <ListRow
          icon="help-circle-outline"
          label="Ajuda"
          onPress={() => navigation.navigate('Help')}
        />
        <ListRow
          icon="logout"
          label="Sair da conta"
          destructive
          showChevron={false}
          onPress={() => {
            Alert.alert('Sair da conta', 'Seus produtos continuam salvos neste aparelho.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sair',
                style: 'destructive',
                onPress: () => {
                  signOut();
                  navigation.replace('Login');
                },
              },
            ]);
          }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { marginLeft: spacing.md, flex: 1 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
  },
});
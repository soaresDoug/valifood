import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import {
  GLOBAL_NOTIFICATION_BUDGET,
  buildNotificationPreview,
  countScheduledNotifications,
  isNotificationPermissionGranted,
} from '../services/notifications';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, shadows, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

/**
 * Tela 11 do design: exemplo de notificação + controle dos lembretes.
 * Mostra quantas notificações estão realmente pendentes no sistema operacional
 * (critério de aceite: sobreviver ao fechamento do app) e permite reagendar.
 */
export function NotificationSettingsScreen({ navigation }: Props) {
  const askNotificationPermission = useSettingsStore(
    (state) => state.askNotificationPermission
  );
  const notificationsGranted = useSettingsStore((state) => state.notificationsGranted);
  const refreshSchedules = useProductStore((state) => state.refreshSchedules);
  const lastRebuild = useProductStore((state) => state.lastRebuild);
  const [pending, setPending] = useState<number | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const preview = buildNotificationPreview();

  const loadPending = useCallback(async () => {
    const granted = await isNotificationPermissionGranted();
    useSettingsStore.getState().setNotificationsGranted(granted);
    setPending(granted ? await countScheduledNotifications() : 0);
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const handleReschedule = async () => {
    setRescheduling(true);
    try {
      await refreshSchedules();
      await loadPending();
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader
        title="Notificações"
        subtitle="Lembretes locais de validade"
        onBack={() => navigation.goBack()}
      />

      <Banner
        icon={notificationsGranted ? 'bell-ring-outline' : 'bell-off-outline'}
        tone={notificationsGranted ? 'success' : 'warning'}
        title={
          notificationsGranted ? 'Notificações permitidas' : 'Permissão de notificação pendente'
        }
        description={
          notificationsGranted
            ? 'Os lembretes são agendados pelo sistema operacional e continuam valendo mesmo com o app fechado.'
            : 'Autorize as notificações para o ValiFood avisar antes do produto vencer.'
        }
        actionLabel={notificationsGranted ? undefined : 'Permitir notificações'}
        onAction={notificationsGranted ? undefined : () => void askNotificationPermission()}
      />

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Exemplo de lembrete
      </AppText>
      <View style={styles.previewCard}>
        {preview.map((item, index) => (
          <View key={`${item.title}-${index}`} style={styles.notification}>
            <View style={styles.notificationIcon}>
              <AppText variant="tiny" color={colors.textOnPrimary}>
                V
              </AppText>
            </View>
            <View style={styles.notificationBody}>
              <AppText variant="label">{item.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {item.body}
              </AppText>
            </View>
            <AppText variant="tiny" color={colors.textMuted}>
              agora
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <ListRow
          variant="info"
          icon="bell-ring-outline"
          label="Lembretes pendentes no aparelho"
          value={pending === null ? '—' : `${pending}`}
        />
        <ListRow
          variant="info"
          icon="clock-outline"
          label="Limite do sistema"
          value={`${GLOBAL_NOTIFICATION_BUDGET} notificações`}
        />
        {lastRebuild ? (
          <ListRow
            variant="info"
            icon="update"
            label="Último reagendamento"
            value={`${lastRebuild.total} agendadas${
              lastRebuild.dropped > 0 ? ` • ${lastRebuild.dropped} redistribuídas` : ''
            }`}
          />
        ) : null}
      </View>

      <Button
        label="Reagendar todos os lembretes"
        icon="update"
        variant="outline"
        loading={rescheduling}
        onPress={handleReschedule}
      />
      <AppText variant="caption" color={colors.textSecondary} center style={styles.note}>
        Ao tocar em um lembrete o ValiFood abre direto nos detalhes do produto. Lembretes de
        itens consumidos, descartados ou excluídos são cancelados automaticamente.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginBottom: spacing.md },
  previewCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  notificationIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationBody: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  note: { marginTop: spacing.md },
});
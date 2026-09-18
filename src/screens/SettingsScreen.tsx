import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectField } from '../components/SelectField';
import { REMINDER_OPTIONS } from '../constants/reminders';
import { countCachedProducts, clearProductCache } from '../db/productRepository';
import type { RootStackParamList } from '../navigation/types';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { colors, radii, shadows, spacing } from '../theme';
import type { ReminderFrequency } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const reminderOptions = REMINDER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

/** Configurações gerais: frequência padrão, aviso de vencido e cache local. */
export function SettingsScreen({ navigation }: Props) {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const products = useProductStore((state) => state.products);
  const refreshSchedules = useProductStore((state) => state.refreshSchedules);
  const removeProduct = useProductStore((state) => state.removeProduct);
  const [cached, setCached] = useState(countCachedProducts());
  const [busy, setBusy] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const clearAll = () => {
    Alert.alert(
      'Limpar estoque',
      `Excluir os ${products.length} produtos cadastrados e cancelar todos os lembretes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              for (const product of products) {
                await removeProduct(product.id);
              }
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Configurações" onBack={() => navigation.goBack()} />

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Lembretes padrão
      </AppText>
      <SelectField
        label="Frequência sugerida no cadastro"
        value={settings.defaultReminderFrequency}
        options={reminderOptions}
        onChange={(value) => {
          updateSettings({ defaultReminderFrequency: value as ReminderFrequency });
          void refreshSchedules();
        }}
        modalTitle="Frequência padrão"
      />

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <AppText variant="label">Avisar quando o produto vencer</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Envia uma última notificação no dia seguinte à validade.
          </AppText>
        </View>
        <Switch
          value={settings.expireAlertEnabled}
          onValueChange={(value) => {
            updateSettings({ expireAlertEnabled: value });
            void refreshSchedules();
          }}
          trackColor={{ true: colors.primaryLight, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Dados locais
      </AppText>
      <View style={styles.card}>
        <ListRow
          variant="info"
          icon="package-variant"
          label="Produtos cadastrados"
          value={`${products.length}`}
        />
        <ListRow
          variant="info"
          icon="magnify"
          label="Produtos em cache (consultas)"
          value={`${cached}`}
        />
        <ListRow
          variant="info"
          icon="cellphone"
          label="Versão do app"
          value={version}
        />
      </View>

      <Button
        label="Limpar cache de consultas"
        variant="outline"
        icon="refresh"
        onPress={() => {
          clearProductCache();
          setCached(0);
          Alert.alert('Cache limpo', 'As próximas leituras vão consultar as APIs novamente.');
        }}
      />
      <View style={styles.spacer} />
      <Button
        label="Limpar todo o estoque"
        variant="danger"
        icon="delete-outline"
        loading={busy}
        onPress={clearAll}
      />
      <AppText variant="caption" color={colors.textSecondary} center style={styles.note}>
        O ValiFood v1 não envia seus produtos para nenhum servidor: toda a base fica no SQLite
        do aparelho.
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  switchText: { flex: 1, marginRight: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  spacer: { height: spacing.md },
  note: { marginTop: spacing.md },
});
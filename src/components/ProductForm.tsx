import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { CATEGORIES, UNITS, getCategory } from '../constants/categories';
import { countPlannedReminders } from '../services/notificationPlanner';
import { colors, radii, spacing } from '../theme';
import type { MeasurementUnit, ProductSource, ReminderFrequency } from '../types';
import { isValidGtin, normalizeBarcode } from '../utils/barcode';
import { formatDateBR, startOfDay, toISODate } from '../utils/dates';
import { AppText } from './AppText';
import { Button } from './Button';
import { DateField } from './DateField';
import { FrequencyPicker } from './FrequencyPicker';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

export interface ProductFormValues {
  barcode: string;
  name: string;
  imageUrl: string | null;
  source: ProductSource;
  category: string;
  quantity: number;
  unit: MeasurementUnit;
  expirationDate: string;
  reminderFrequency: ReminderFrequency;
  customIntervalDays: number | null;
}

export interface ProductFormProps {
  initial: {
    barcode?: string;
    name?: string;
    imageUrl?: string | null;
    source?: ProductSource;
    category?: string;
    quantity?: number;
    unit?: MeasurementUnit;
    expirationDate?: string | null;
    reminderFrequency?: ReminderFrequency;
    customIntervalDays?: number | null;
  };
  brand?: string | null;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  submitLabel?: string;
  /** Permite editar o código de barras (cadastro manual/digitado). */
  editableBarcode?: boolean;
  /** Bloco extra mostrado antes do formulário (ex.: card do produto). */
  header?: React.ReactNode;
  footerNote?: string;
}

const categoryOptions = CATEGORIES.map((category) => ({
  value: category.id,
  label: category.label,
  icon: category.icon,
}));

const unitOptions = UNITS.map((unit) => ({ value: unit.value, label: unit.label }));

/**
 * Formulário único de cadastro/edição (telas 4, 6 e cadastro manual).
 * Bloqueia o salvamento sem validade e sem frequência (critérios de aceite).
 */
export function ProductForm({
  initial,
  brand,
  onSubmit,
  submitLabel = 'Salvar',
  editableBarcode = false,
  header,
  footerNote,
}: ProductFormProps) {
  const [barcode, setBarcode] = useState(normalizeBarcode(initial.barcode ?? ''));
  const [name, setName] = useState(initial.name ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(initial.imageUrl ?? null);
  const [category, setCategory] = useState(initial.category ?? 'outros');
  const [quantity, setQuantity] = useState(String(initial.quantity ?? 1));
  const [unit, setUnit] = useState<MeasurementUnit>(initial.unit ?? 'un');
  const [expirationDate, setExpirationDate] = useState<string | null>(
    initial.expirationDate ?? null
  );
  const [frequency, setFrequency] = useState<ReminderFrequency>(
    initial.reminderFrequency ?? 'every_3_days'
  );
  const [customDays, setCustomDays] = useState<number | null>(
    initial.customIntervalDays ?? null
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);

  const estimate = useMemo(() => {
    if (!expirationDate) return null;
    return countPlannedReminders({
      expirationDate,
      frequency,
      customIntervalDays: customDays,
    });
  }, [customDays, expirationDate, frequency]);

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          `Autorize o acesso ${source === 'camera' ? 'à câmera' : 'às suas fotos'} para usar a imagem do produto.`
        );
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true });
      if (!result.canceled && result.assets[0]) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('[form] falha ao escolher imagem', error);
      Alert.alert('Não foi possível abrir a imagem', 'Tente novamente.');
    }
  };

  const handleSubmit = async () => {
    const today = toISODate(startOfDay(new Date()));
    const nextErrors: Record<string, string | null> = {};
    if (name.trim().length < 2) nextErrors.name = 'Informe o nome do produto';
    if (!expirationDate) nextErrors.expirationDate = 'Informe a data de validade';
    else if (expirationDate < today) {
      nextErrors.expirationDate = 'A validade não pode estar no passado';
    }
    if (!frequency) nextErrors.frequency = 'Escolha a frequência do lembrete';
    if (frequency === 'custom' && (!customDays || customDays < 1)) {
      nextErrors.frequency = 'Informe um intervalo maior que zero';
    }
    const parsedQuantity = Number(quantity.replace(',', '.'));
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero';
    }
    if (editableBarcode && barcode.length > 0 && !isValidGtin(barcode)) {
      nextErrors.barcode = 'Código de barras inválido (confira os dígitos)';
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      await onSubmit({
        barcode,
        name: name.trim(),
        imageUrl,
        source: initial.source ?? 'manual',
        category,
        quantity: parsedQuantity,
        unit,
        expirationDate: expirationDate as string,
        reminderFrequency: frequency,
        customIntervalDays: frequency === 'custom' ? customDays : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const categoryInfo = getCategory(category);

  return (
    <View>
      {header}
      {header ? (
        <AppText variant="subtitle" style={styles.blockTitle}>
          Informações do produto
        </AppText>
      ) : null}

      <View style={styles.imageRow}>
        <View style={styles.imagePreview}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
          ) : (
            <MaterialCommunityIcons
              name={categoryInfo.icon}
              size={28}
              color={colors.textOnPrimary}
            />
          )}
        </View>
        <View style={styles.imageActions}>
          <AppText variant="caption" color={colors.textSecondary}>
            {imageUrl ? 'Imagem do produto' : 'Sem imagem — tire uma foto'}
          </AppText>
          <View style={styles.imageButtons}>
            <Pressable
              onPress={() => void pickImage('camera')}
              style={styles.imageButton}
              accessibilityRole="button"
              accessibilityLabel="Tirar foto do produto"
            >
              <MaterialCommunityIcons name="camera" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => void pickImage('library')}
              style={styles.imageButton}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto da galeria"
            >
              <MaterialCommunityIcons name="image-plus" size={18} color={colors.primary} />
            </Pressable>
            {imageUrl ? (
              <Pressable
                onPress={() => setImageUrl(null)}
                style={styles.imageButton}
                accessibilityRole="button"
                accessibilityLabel="Remover imagem"
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <TextField
        label="Nome do alimento"
        value={name}
        onChangeText={setName}
        placeholder="Ex.: Leite integral"
        error={errors.name}
        hint={brand ? `Marca: ${brand}` : undefined}
      />

      <SelectField
        label="Categoria"
        value={category}
        options={categoryOptions}
        onChange={setCategory}
        modalTitle="Categoria do produto"
      />

      {editableBarcode ? (
        <TextField
          label="Código de barras"
          value={barcode}
          onChangeText={(text) => setBarcode(normalizeBarcode(text))}
          keyboardType="number-pad"
          placeholder="Ex.: 7891000200336"
          error={errors.barcode}
          maxLength={14}
        />
      ) : null}

      <DateField
        label="Data de validade"
        value={expirationDate}
        onChange={setExpirationDate}
        error={errors.expirationDate}
        hint="Não é possível informar uma data no passado."
      />

      <View style={styles.quantityRow}>
        <View style={styles.quantityField}>
          <TextField
            label="Quantidade"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="Ex.: 1"
            error={errors.quantity}
          />
        </View>
        <View style={styles.unitField}>
          <SelectField
            label="Unidade"
            value={unit}
            options={unitOptions}
            onChange={(value) => setUnit(value as MeasurementUnit)}
            modalTitle="Unidade de medida"
          />
        </View>
      </View>

      <FrequencyPicker
        value={frequency}
        customIntervalDays={customDays}
        onChange={setFrequency}
        onCustomDaysChange={setCustomDays}
        error={errors.frequency}
        hint={
          estimate !== null
            ? estimate === 0
              ? 'Nenhum lembrete futuro: a validade é hoje ou já passou.'
              : `Vamos agendar ${estimate} ${estimate === 1 ? 'lembrete' : 'lembretes'} até ${formatDateBR(expirationDate as string)}.`
            : 'Escolha com que frequência quer ser lembrado.'
        }
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={saving} />

      {footerNote ? (
        <AppText variant="caption" color={colors.textSecondary} center style={styles.note}>
          {footerNote}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  blockTitle: { marginBottom: spacing.md },
  imageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 72, height: 72 },
  imageActions: { flex: 1, marginLeft: spacing.md },
  imageButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  imageButton: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  quantityRow: { flexDirection: 'row', gap: spacing.md },
  quantityField: { flex: 1 },
  unitField: { flex: 1.2 },
  note: { marginTop: spacing.md },
});
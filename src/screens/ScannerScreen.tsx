import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { resolveProduct } from '../services/productResolver';
import { colors, radii, spacing } from '../theme';
import { isPlausibleBarcode, isValidGtin, normalizeBarcode } from '../utils/barcode';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

/**
 * Tela 5 do design: leitura do código de barras com `CameraView` do
 * `expo-camera` (o `expo-barcode-scanner` foi removido no SDK 52).
 *
 * Robustez exigida pela seção 4.1:
 * - debounce de 2s para ignorar leituras repetidas do mesmo código;
 * - lanterna (torch) para ambientes escuros;
 * - loading enquanto a API responde;
 * - qualquer falha cai no cadastro manual com o código pré-preenchido.
 */
const DUPLICATE_READ_WINDOW_MS = 2000;

export function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const lastReadAt = useRef(0);
  const handled = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcode = useCallback(
    async (raw: string) => {
      if (handled.current || busy) return;
      const code = normalizeBarcode(raw);
      const now = Date.now();

      // Debounce: ignora releituras do mesmo código na janela de 2 segundos.
      if (code === lastCode && now - lastReadAt.current < DUPLICATE_READ_WINDOW_MS) return;
      lastReadAt.current = now;
      setLastCode(code);
      if (!isPlausibleBarcode(code)) return;

      handled.current = true;
      setBusy(true);
      const result = await resolveProduct(code);
      setBusy(false);

      if (result.status === 'found' && result.product) {
        navigation.replace('ProductFound', { resolved: result.product });
        return;
      }

      // Nenhuma API conheceu o produto → cadastro manual (obrigatório).
      navigation.replace('ManualProduct', { barcode: code, lookupFailed: true });
    },
    [busy, lastCode, navigation]
  );

  const goManual = useCallback(
    () => navigation.replace('AddProduct', { barcode: lastCode ?? undefined }),
    [lastCode, navigation]
  );

  const renderBody = () => {
    if (!permission) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textOnPrimary} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={48} color={colors.accent} />
          <AppText variant="subtitle" color={colors.textOnPrimary} center style={styles.permTitle}>
            Precisamos da câmera
          </AppText>
          <AppText variant="body" color={colors.accent} center style={styles.permText}>
            A câmera é usada apenas para ler o código de barras do produto.
          </AppText>
          <Button
            label="Permitir acesso"
            variant="accent"
            onPress={() => void requestPermission()}
            fullWidth={false}
            style={styles.permButton}
          />
          <Button label="Digitar o código" variant="ghost" onPress={goManual} style={styles.permLink} />
        </View>
      );
    }

    return (
      <>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'],
          }}
          onBarcodeScanned={busy ? undefined : ({ data }) => void handleBarcode(data)}
        />

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.frameWrapper} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <AppText variant="caption" color={colors.textOnPrimary} center style={styles.hint}>
              Posicione o código de barras dentro da moldura
            </AppText>
          </View>

          {busy ? (
            <View style={styles.statusCard}>
              <ActivityIndicator color={colors.accent} />
              <AppText variant="bodySmall" color={colors.textOnPrimary} style={styles.statusText}>
                Consultando produto...
              </AppText>
            </View>
          ) : lastCode ? (
            <View style={styles.statusCard}>
              <AppText variant="caption" color={colors.accent}>
                Código lido:
              </AppText>
              <AppText variant="subtitle" color={colors.textOnPrimary}>
                {lastCode}
              </AppText>
              {!isValidGtin(lastCode) ? (
                <AppText variant="caption" color={colors.warning} center>
                  Dígito verificador inválido — confira se a leitura está completa.
                </AppText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.controls}>
            <Pressable
              onPress={() => setTorch((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel="Lanterna"
              style={[styles.controlButton, torch && styles.controlButtonActive]}
            >
              <MaterialCommunityIcons
                name="flashlight"
                size={22}
                color={torch ? colors.primaryDark : colors.textOnPrimary}
              />
            </Pressable>
            <Pressable
              onPress={goManual}
              accessibilityRole="button"
              accessibilityLabel="Digitar código manualmente"
              style={styles.controlButton}
            >
              <MaterialCommunityIcons
                name="backspace-outline"
                size={22}
                color={colors.textOnPrimary}
              />
            </Pressable>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenHeader dark title="Escanear código de barras" onBack={() => navigation.goBack()} />
        <View style={styles.cameraArea}>{renderBody()}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#08130D' },
  safe: { flex: 1 },
  cameraArea: { flex: 1, borderRadius: radii.xl, overflow: 'hidden', margin: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permTitle: { marginTop: spacing.lg },
  permText: { marginTop: spacing.sm },
  permButton: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  permLink: { marginTop: spacing.sm },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  frameWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 250,
    height: 250,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.textOnPrimary },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radii.md,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radii.md,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radii.md,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: radii.md,
  },
  hint: { marginTop: spacing.lg },
  statusCard: {
    alignSelf: 'center',
    backgroundColor: 'rgba(8,19,13,0.78)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statusText: { marginTop: spacing.sm },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: { backgroundColor: colors.accent },
});
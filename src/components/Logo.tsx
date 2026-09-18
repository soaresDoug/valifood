import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import { AppText } from './AppText';

export interface LogoMarkProps {
  size?: number;
  /** Cores do "V" e da folha. */
  color?: string;
  leafColor?: string;
}

/**
 * Símbolo do ValiFood: o "V" com a folha (desenhado em vetor para ficar nítido
 * em qualquer tamanho e não depender de imagens).
 */
export function LogoMark({
  size = 64,
  color = colors.primary,
  leafColor = colors.accent,
}: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Braço esquerdo do V */}
      <Path
        d="M23 20 L45 74"
        stroke={color}
        strokeWidth={17}
        strokeLinecap="round"
        fill="none"
      />
      {/* Braço direito (mais curto, dá lugar à folha) */}
      <Path
        d="M45 74 L60 36"
        stroke={color}
        strokeWidth={17}
        strokeLinecap="round"
        fill="none"
      />
      {/* Folha */}
      <Path
        d="M52 60 C58 38 70 24 90 18 C88 40 76 55 56 62 Z"
        fill={leafColor}
      />
      <Path
        d="M57 58 C66 46 76 33 86 24"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.35}
      />
    </Svg>
  );
}

export interface LogoProps extends LogoMarkProps {
  showWordmark?: boolean;
  wordmarkSize?: number;
  light?: boolean;
}

/** Assinatura completa: símbolo + "ValiFood" + tagline opcional. */
export function Logo({
  size = 72,
  showWordmark = true,
  wordmarkSize = 28,
  light = false,
  color = light ? colors.textOnPrimary : colors.primary,
  leafColor = light ? colors.accent : colors.accent,
}: LogoProps) {
  return (
    <View style={styles.container}>
      <LogoMark size={size} color={color} leafColor={leafColor} />
      {showWordmark ? (
        <View style={styles.wordmark}>
          <AppText
            variant="titleLarge"
            weight="bold"
            color={color}
            style={{ fontSize: wordmarkSize, lineHeight: wordmarkSize * 1.25 }}
          >
            Vali
          </AppText>
          <AppText
            variant="titleLarge"
            weight="bold"
            color={light ? colors.accent : colors.primaryLight}
            style={{ fontSize: wordmarkSize, lineHeight: wordmarkSize * 1.25 }}
          >
            Food
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  wordmark: { flexDirection: 'row', marginTop: 4 },
});
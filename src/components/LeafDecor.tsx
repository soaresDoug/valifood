import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

interface LeafDecorProps {
  /** 'bottom' desenha as folhas no rodapé (telas de abertura / sidebar). */
  position?: 'bottom' | 'corner';
  color?: string;
  opacity?: number;
  style?: ViewStyle;
}

/**
 * Folhas decorativas do fundo (telas 1, 2 e 12 do design).
 * São puramente decorativas: `pointerEvents="none"` para não bloquear toques.
 */
export function LeafDecor({
  position = 'bottom',
  color = colors.accent,
  opacity = 0.35,
  style,
}: LeafDecorProps) {
  return (
    <View
      pointerEvents="none"
      style={[position === 'bottom' ? styles.bottom : styles.corner, style]}
    >
      <Svg width={position === 'bottom' ? 420 : 220} height={position === 'bottom' ? 260 : 220} viewBox="0 0 420 260">
        <Path
          d="M8 250 C20 150 80 62 200 12 C186 118 128 208 8 250 Z"
          fill={color}
          opacity={opacity}
        />
        <Path
          d="M120 250 C142 178 196 116 300 84 C282 172 226 232 120 250 Z"
          fill={color}
          opacity={opacity * 0.75}
        />
        <Path
          d="M250 260 C280 210 330 172 410 152 C392 218 340 254 250 260 Z"
          fill={color}
          opacity={opacity * 0.55}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -40,
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    right: -30,
    bottom: -30,
  },
});
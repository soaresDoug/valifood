import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radii, spacing, textVariants } from '../theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

/** Barra de busca da tela de estoque (design tela 8). */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar produto',
  onFilterPress,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, { borderColor: focused ? colors.primary : colors.border }]}>
      <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Buscar produto"
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Limpar busca">
          <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      {onFilterPress ? (
        <Pressable onPress={onFilterPress} hitSlop={10} accessibilityLabel="Filtrar">
          <MaterialCommunityIcons name="filter-variant" size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: { flex: 1, ...textVariants.body, color: colors.textPrimary },
});
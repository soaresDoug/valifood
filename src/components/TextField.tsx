import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, textVariants } from '../theme';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  hint?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onPressRightIcon?: () => void;
  /** Campos "somente leitura mas editáveis" do cadastro (design tela 6). */
  suffix?: string;
  containerStyle?: ViewStyle;
}

/** Campo de texto com rótulo, ícone opcional e mensagem de erro. */
export function TextField({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onPressRightIcon,
  suffix,
  containerStyle,
  editable = true,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="label" color={colors.textPrimary} style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          { borderColor, backgroundColor: editable ? colors.surface : colors.surfaceMuted },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={colors.textSecondary}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          {...rest}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            rest.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            rest.onBlur?.(event);
          }}
          style={[styles.input, rest.multiline ? styles.inputMultiline : null]}
        />
        {suffix ? (
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {suffix}
          </AppText>
        ) : null}
        {rightIcon ? (
          <Pressable
            onPress={onPressRightIcon}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={rightIcon}
          >
            <MaterialCommunityIcons name={rightIcon} size={20} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.message}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.message}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: {
    flex: 1,
    ...textVariants.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  icon: { marginRight: spacing.sm },
  message: { marginTop: spacing.xs },
});
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export interface ScreenContainerProps {
  children: ReactNode;
  /** Habilita rolagem (a maioria das telas de formulário). */
  scroll?: boolean;
  /** Remove o padding horizontal padrão (telas com faixas coloridas). */
  noPadding?: boolean;
  backgroundColor?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Desativa o SafeAreaView (tela do scanner usa a câmera em tela cheia). */
  edgeToEdge?: boolean;
}

/** Container padrão das telas: cor de fundo + safe area + padding. */
export function ScreenContainer({
  children,
  scroll = false,
  noPadding = false,
  backgroundColor = colors.background,
  style,
  contentStyle,
  edgeToEdge = false,
}: ScreenContainerProps) {
  const content = (
    <View style={[!noPadding && styles.padding, contentStyle]}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  if (edgeToEdge) {
    return <View style={[styles.flex, { backgroundColor }, style]}>{body}</View>;
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={['top', 'left', 'right']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padding: { paddingHorizontal: spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xxl },
});
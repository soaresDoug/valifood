import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme';
import { AppText } from './AppText';
import { LeafDecor } from './LeafDecor';
import { Logo } from './Logo';

export interface DrawerItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

export interface SideDrawerProps {
  title?: string;
  items: DrawerItem[];
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

/** Menu lateral (tela 12 do design), apresentado como modal transparente. */
export function SideDrawer({
  title = 'Menu',
  items,
  onClose,
  userName,
  userEmail,
}: SideDrawerProps) {
  const translateX = useRef(new Animated.Value(-320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const width = 300;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateX]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
        />
      </Animated.View>

      <Animated.View
        style={[styles.panel, { width, transform: [{ translateX }] }]}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <Logo showWordmark wordmarkSize={22} size={40} />
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fechar menu"
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          {userName ? (
            <View style={styles.user}>
              <AppText variant="label" numberOfLines={1}>
                {userName}
              </AppText>
              {userEmail ? (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {userEmail}
                </AppText>
              ) : null}
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                accessibilityRole="button"
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.destructive ? colors.danger : colors.textSecondary}
                  style={styles.itemIcon}
                />
                <AppText
                  variant="body"
                  color={item.destructive ? colors.danger : colors.textPrimary}
                  style={styles.itemLabel}
                >
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <LeafDecor position="corner" opacity={0.5} />
            <View style={styles.footerBrand}>
              <Logo showWordmark wordmarkSize={18} size={32} />
              <AppText variant="caption" color={colors.textSecondary}>
                Mais controle. Menos desperdício.
              </AppText>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  backdropPress: { flex: 1 },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    borderTopRightRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row' },
  user: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  itemPressed: { backgroundColor: colors.surfaceMuted },
  itemIcon: { marginRight: spacing.md },
  itemLabel: { flex: 1 },
  footer: { paddingTop: spacing.lg },
  footerBrand: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'flex-start',
  },
});
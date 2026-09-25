import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';
import {
  TAB_BAR_ICON_SIZE,
  TAB_BAR_ICON_SIZE_INACTIVE,
  TAB_BAR_LABEL_MARGIN_TOP,
  getTabBarLayout,
} from './tabBarMetrics';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { StockScreen } from '../screens/StockScreen';
import { colors, textVariants } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Home: 'home-variant',
  Stock: 'package-variant',
  History: 'history',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Início',
  Stock: 'Estoque',
  History: 'Histórico',
};

/**
 * Barra inferior do design (telas 3, 8 e 9): Início, Estoque e Histórico.
 *
 * A altura NÃO é fixa: o `height` do `tabBarStyle` é a altura final da barra e o
 * sistema ainda injeta o inset inferior como `paddingBottom`. Ver
 * `./tabBarMetrics` — era exatamente esse detalhe que cortava os rótulos no iOS.
 */
export function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBar = getTabBarLayout({
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    bottomInset: insets.bottom,
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: LABELS[route.name],
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, { height: tabBar.height, paddingBottom: insets.bottom }],
        tabBarItemStyle: { paddingTop: tabBar.itemPaddingTop },
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name]}
            size={focused ? TAB_BAR_ICON_SIZE : TAB_BAR_ICON_SIZE_INACTIVE}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabLabel: {
    ...textVariants.tiny,
    marginTop: TAB_BAR_LABEL_MARGIN_TOP,
  },
});
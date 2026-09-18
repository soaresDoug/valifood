import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet } from 'react-native';
import type { MainTabParamList } from './types';
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

/** Barra inferior do design (telas 3, 8 e 9): Início, Estoque e Histórico. */
export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabel: LABELS[route.name],
        tabBarLabelStyle: {
          ...textVariants.caption,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name]}
            size={focused ? 25 : 23}
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
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  tabItem: { paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
});
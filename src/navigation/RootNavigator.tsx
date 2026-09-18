import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { AddProductScreen } from '../screens/AddProductScreen';
import { EditProductScreen } from '../screens/EditProductScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ManualProductScreen } from '../screens/ManualProductScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { ProductFoundScreen } from '../screens/ProductFoundScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SideMenuScreen } from '../screens/SideMenuScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SplashScreen } from '../screens/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Pilha principal do app. Cada tela desenha o próprio cabeçalho (para replicar
 * o design), então o header nativo fica desligado.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="ProductFound" component={ProductFoundScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="ManualProduct" component={ManualProductScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen
        name="SideMenu"
        component={SideMenuScreen}
        options={{ presentation: 'transparentModal', animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}
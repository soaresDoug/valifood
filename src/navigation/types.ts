import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ResolvedProduct } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Scanner: undefined;
  /** Tela 5 → 6: produto identificado na API, faltando validade/frequência. */
  ProductFound: { resolved: ResolvedProduct };
  /** Tela 4: cadastro com código escaneado ou digitado manualmente. */
  AddProduct: { barcode?: string } | undefined;
  /** Tela de fallback quando nenhuma API conhece o código (seção 4.4). */
  ManualProduct: { barcode: string; lookupFailed?: boolean } | undefined;
  ProductDetails: { productId: string };
  /** Edição da validade/frequência de um produto existente. */
  EditProduct: { productId: string };
  EditProfile: undefined;
  /** Tela 10 do design (perfil), acessível pelo menu lateral/Home. */
  Profile: undefined;
  NotificationSettings: undefined;
  Settings: undefined;
  Privacy: undefined;
  Help: undefined;
  SideMenu: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stock: undefined;
  History: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
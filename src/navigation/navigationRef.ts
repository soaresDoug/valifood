import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Referência de navegação usada fora de componentes React
 * (ex.: toque em uma notificação abrindo os detalhes do produto — seção 5.3).
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * O `navigate` é chamado com uma rota genérica; tipamos o acesso pontualmente
 * para manter o resto do app com checagem estrita.
 */
const untypedNavigate = navigationRef as unknown as {
  navigate: (name: string, params?: object) => void;
};

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
): void {
  if (navigationRef.isReady()) {
    untypedNavigate.navigate(name as string, params as object | undefined);
  }
}

/** Abre os detalhes do produto a partir de uma notificação. */
export function openProductFromNotification(productId: string): void {
  navigate('ProductDetails', { productId });
}
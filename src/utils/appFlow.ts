/**
 * Regras de navegacao do fluxo de entrada (modulo puro, testavel).
 *
 * Fluxo definido na especificacao:
 *   Splash -> Login (nome) -> Onboarding (apenas na primeira vez) -> Tela principal
 */

export type StartRoute = 'Login' | 'Main';
export type PostLoginRoute = 'Onboarding' | 'Main';

/** Para onde a splash manda o usuario ao abrir o app. */
export function resolveStartRoute(hasProfile: boolean): StartRoute {
  return hasProfile ? 'Main' : 'Login';
}

/**
 * Depois de informar o nome: onboarding na primeira vez
 * (`onboardingDone === false`), tela principal nas sessoes seguintes.
 */
export function resolvePostLoginRoute(onboardingDone: boolean): PostLoginRoute {
  return onboardingDone ? 'Main' : 'Onboarding';
}

/** Normaliza o nome digitado (remove espacos nas pontas). */
export function normalizeUserName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/** Nome valido: pelo menos 2 caracteres que nao sejam espaco. */
export function isValidUserName(raw: string): boolean {
  return normalizeUserName(raw).length >= 2;
}

export const MIN_SPLASH_DURATION_MS = 2000;
export const SPLASH_FADE_DURATION_MS = 350;

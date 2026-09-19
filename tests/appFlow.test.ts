import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MIN_SPLASH_DURATION_MS,
  SPLASH_FADE_DURATION_MS,
  isValidUserName,
  normalizeUserName,
  resolvePostLoginRoute,
  resolveStartRoute,
} from '../src/utils/appFlow';

/**
 * Fluxo de entrada (tarefas 1 a 3): Splash -> Login (nome) -> Onboarding
 * (apenas na primeira vez) -> Tela principal.
 */
describe('utils/appFlow', () => {
  it('manda para o login quando ainda nao ha nome salvo', () => {
    assert.equal(resolveStartRoute(false), 'Login');
  });

  it('vai direto para a tela principal quando o nome ja esta salvo', () => {
    assert.equal(resolveStartRoute(true), 'Main');
  });

  it('mostra o onboarding apenas na primeira vez', () => {
    assert.equal(resolvePostLoginRoute(false), 'Onboarding');
    assert.equal(resolvePostLoginRoute(true), 'Main');
  });

  it('normaliza o nome digitado (espacos extras e nas pontas)', () => {
    assert.equal(normalizeUserName('  Ana   Silva  '), 'Ana Silva');
    assert.equal(normalizeUserName('   '), '');
  });

  it('bloqueia nome vazio ou so com espacos', () => {
    assert.equal(isValidUserName(''), false);
    assert.equal(isValidUserName('    '), false);
    assert.equal(isValidUserName(' A '), false);
    assert.equal(isValidUserName('Ana'), true);
    assert.equal(isValidUserName('  Ana  '), true);
  });

  it('mantem a splash visivel por ~2s com fade de 350ms', () => {
    assert.equal(MIN_SPLASH_DURATION_MS, 2000);
    assert.ok(SPLASH_FADE_DURATION_MS >= 300 && SPLASH_FADE_DURATION_MS <= 500);
  });
});
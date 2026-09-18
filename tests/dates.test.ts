import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatDateBR,
  formatDayGroup,
  formatExpirationLabel,
  getUrgencyLevel,
  parseDateBR,
  parseISODate,
  toISODate,
} from '../src/utils/dates';

/** Utilitários de data usados nas telas (urgência, validade, histórico). */
describe('utils/dates', () => {
  const now = new Date(2026, 8, 18, 10, 30); // 18/09/2026 10:30

  it('formata datas em pt-BR e faz round-trip do ISO', () => {
    assert.equal(formatDateBR('2026-09-18'), '18/09/2026');
    assert.equal(toISODate(parseISODate('2026-09-18')), '2026-09-18');
    assert.equal(formatDateBR(null), '--/--/----');
  });

  it('descreve a proximidade da validade', () => {
    assert.equal(formatExpirationLabel('2026-09-18', now), 'Vence hoje');
    assert.equal(formatExpirationLabel('2026-09-19', now), 'Vence amanhã');
    assert.equal(formatExpirationLabel('2026-09-21', now), 'Vence em 3 dias');
    assert.equal(formatExpirationLabel('2026-09-17', now), 'Venceu ontem');
    assert.equal(formatExpirationLabel('2026-09-15', now), 'Venceu há 3 dias');
  });

  it('classifica a urgência conforme a seção 4.3', () => {
    assert.equal(getUrgencyLevel('2026-09-26', now), 'safe'); // 8 dias
    assert.equal(getUrgencyLevel('2026-09-25', now), 'soon'); // 7 dias
    assert.equal(getUrgencyLevel('2026-09-21', now), 'soon'); // 3 dias
    assert.equal(getUrgencyLevel('2026-09-20', now), 'critical'); // 2 dias
    assert.equal(getUrgencyLevel('2026-09-18', now), 'critical'); // hoje
    assert.equal(getUrgencyLevel('2026-09-17', now), 'expired'); // ontem
  });

  it('valida datas digitadas manualmente', () => {
    assert.equal(toISODate(parseDateBR('18/09/2026')!), '2026-09-18');
    assert.equal(parseDateBR('31/02/2026'), null);
    assert.equal(parseDateBR('2026-09-18'), null);
    assert.equal(parseDateBR('18/9/2026')?.getMonth(), 8);
  });

  it('agrupa o histórico em Hoje / Ontem / data', () => {
    assert.equal(formatDayGroup(new Date(2026, 8, 18, 12), now), 'Hoje');
    assert.equal(formatDayGroup(new Date(2026, 8, 17, 12), now), 'Ontem');
    assert.equal(formatDayGroup(new Date(2026, 8, 10, 12), now), '10/09/2026');
  });
});
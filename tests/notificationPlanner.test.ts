import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildNotificationContent,
  countPlannedReminders,
  downsampleUniform,
  effectiveIntervalDays,
  nextReminderDate,
  planReminders,
  planRemindersForProduct,
  type PlannedReminder,
} from '../src/services/notificationPlanner';
import type { Product } from '../src/types';

const NOW = () => new Date(2026, 8, 18, 10, 30); // 18/09/2026 10:30

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prd_1',
    barcode: '7891000100103',
    name: 'Leite Integral',
    imageUrl: null,
    source: 'openfoodfacts',
    category: 'laticinios',
    quantity: 1,
    unit: 'un',
    expirationDate: '2026-09-21',
    reminderFrequency: 'daily',
    customIntervalDays: null,
    status: 'active',
    notificationIds: [],
    createdAt: '2026-09-18T10:00:00.000Z',
    consumedAt: null,
    discardedAt: null,
    ...overrides,
  };
}

const days = (planned: PlannedReminder[]) => planned.map((item) => item.date.getDate());
const months = (planned: PlannedReminder[]) => planned.map((item) => item.date.getMonth());
const remindersOnly = (planned: PlannedReminder[]) =>
  planned.filter((item) => item.kind === 'reminder');

/**
 * Regras das seções 4.2/5.2: lembretes ancorados na validade (retroativamente)
 * e nada agendado depois da validade além do aviso final de "produto vencido".
 */
describe('services/notificationPlanner', () => {
  it('agenda um lembrete por dia na frequência diária', () => {
    const reminders = remindersOnly(
      planReminders({ expirationDate: '2026-09-21', frequency: 'daily', now: NOW() })
    );
    // 19, 20 e 21/09 às 09:00 (o horário de hoje já passou às 10:30).
    assert.equal(reminders.length, 3);
    assert.deepEqual(days(reminders), [19, 20, 21]);
    assert.deepEqual(
      reminders.map((item) => item.daysUntilExpiration),
      [2, 1, 0]
    );
    assert.equal(reminders[0].date.getHours(), 9);
  });

  it('ancora as ocorrências na validade (frequência semanal)', () => {
    const reminders = remindersOnly(
      planReminders({ expirationDate: '2026-10-16', frequency: 'weekly', now: NOW() })
    );
    // Retrocede de 7 em 7 dias a partir de 16/10: 25/09, 02/10, 09/10 e 16/10.
    assert.deepEqual(days(reminders), [25, 2, 9, 16]);
    assert.deepEqual(months(reminders), [8, 9, 9, 9]);
  });

  it('"apenas 1 dia antes" gera um único lembrete, na véspera', () => {
    const reminders = remindersOnly(
      planReminders({ expirationDate: '2026-09-21', frequency: '1_day_before', now: NOW() })
    );
    assert.equal(reminders.length, 1);
    assert.equal(reminders[0].date.getDate(), 20);
    assert.equal(reminders[0].daysUntilExpiration, 1);
  });

  it('respeita o intervalo personalizado', () => {
    const reminders = remindersOnly(
      planReminders({
        expirationDate: '2026-09-30',
        frequency: 'custom',
        customIntervalDays: 5,
        now: NOW(),
      })
    );
    // 15/09 já passou (hoje é 18/09), então sobram 20, 25 e 30/09.
    assert.deepEqual(days(reminders), [20, 25, 30]);
  });

  it('nunca agenda lembrete depois da validade, só o aviso de vencido', () => {
    const planned = planReminders({
      expirationDate: '2026-09-21',
      frequency: 'daily',
      now: NOW(),
    });
    const expiry = new Date(2026, 8, 21, 23, 59).getTime();
    const afterExpiry = planned.filter((item) => item.date.getTime() > expiry);
    assert.equal(afterExpiry.length, 1);
    assert.equal(afterExpiry[0].kind, 'expired');
    assert.equal(afterExpiry[0].date.getDate(), 22);
    assert.equal(planned[planned.length - 1].kind, 'expired');
  });

  it('permite desligar o aviso final de vencido', () => {
    const planned = planReminders({
      expirationDate: '2026-09-21',
      frequency: 'daily',
      now: NOW(),
      includeExpiredAlert: false,
    });
    assert.equal(
      planned.every((item) => item.kind === 'reminder'),
      true
    );
  });

  it('descarta horários já passados no mesmo dia', () => {
    const planned = planReminders({
      expirationDate: '2026-09-18',
      frequency: 'daily',
      now: new Date(2026, 8, 18, 10, 30),
    });
    // Vence hoje, mas às 09:00 já passou: sobra apenas o aviso de vencido.
    assert.equal(remindersOnly(planned).length, 0);
    assert.equal(planned.length, 1);
    assert.equal(planned[0].kind, 'expired');
  });

  it('não agenda nada para validade distante no passado', () => {
    assert.equal(
      planReminders({ expirationDate: '2026-09-01', frequency: 'daily', now: NOW() }).length,
      0
    );
  });

  it('não gera datas no passado', () => {
    const planned = planReminders({
      expirationDate: '2026-10-05',
      frequency: 'every_3_days',
      now: NOW(),
    });
    assert.equal(
      planned.some((item) => item.date.getTime() <= NOW().getTime()),
      false
    );
  });

  it('conta os lembretes e devolve o próximo', () => {
    const options = {
      expirationDate: '2026-09-21',
      frequency: 'every_3_days' as const,
      now: NOW(),
    };
    assert.equal(countPlannedReminders(options), 2); // 21/09 + aviso de 22/09
    assert.equal(nextReminderDate(options)?.getDate(), 21);
  });

  it('cobre o intervalo efetivo de cada frequência', () => {
    assert.equal(effectiveIntervalDays('daily'), 1);
    assert.equal(effectiveIntervalDays('every_3_days'), 3);
    assert.equal(effectiveIntervalDays('weekly'), 7);
    assert.equal(effectiveIntervalDays('1_day_before'), 1);
    assert.equal(effectiveIntervalDays('custom', 10), 10);
    assert.equal(effectiveIntervalDays('custom', 0), 1);
  });

  it('escreve o conteúdo dinâmico conforme os dias restantes', () => {
    const today = buildNotificationContent('Frango', '2026-09-18', 'reminder', 0);
    assert.equal(today.title, 'Frango');
    assert.match(today.body, /Vence hoje \(18\/09\/2026\)/);
    assert.match(
      buildNotificationContent('Leite', '2026-09-19', 'reminder', 1).body,
      /Vence amanhã/
    );
    assert.match(
      buildNotificationContent('Arroz', '2026-09-30', 'reminder', 12).body,
      /Vence em 12 dias/
    );
    const expired = buildNotificationContent('Queijo', '2026-09-17', 'expired', -1);
    assert.match(expired.title, /venceu/);
    assert.match(expired.body, /17\/09\/2026/);
  });

  it('reduz uniformemente quando passa do orçamento do sistema', () => {
    const items = Array.from({ length: 100 }, (_, index) => index);
    const reduced = downsampleUniform(items, 10);
    assert.equal(reduced.length, 10);
    assert.equal(reduced[0], 0);
    assert.equal(reduced[reduced.length - 1], 99);
    assert.equal(downsampleUniform(items, 0).length, 0);
    assert.equal(downsampleUniform(items, 1).length, 1);
    assert.equal(downsampleUniform([1, 2], 5).length, 2);
  });
});

describe('services/notificationPlanner (cenário do design)', () => {
  it('replica a agenda do Leite Integral a cada 3 dias', () => {
    const reminders = remindersOnly(
      planReminders({ expirationDate: '2026-09-30', frequency: 'every_3_days', now: NOW() })
    );
    assert.deepEqual(days(reminders), [21, 24, 27, 30]);
  });

  it('preenche o título com o nome do produto cadastrado', () => {
    const planned = planRemindersForProduct(makeProduct(), NOW());
    assert.equal(
      planned.every((item) => item.title.startsWith('Leite Integral')),
      true
    );
    assert.match(planned[0].body, /Vence em 2 dias/);
  });

  it('respeita a hora padrão configurada (09:00)', () => {
    const planned = planRemindersForProduct(makeProduct({ expirationDate: '2026-09-25' }), NOW(), {
      hour: 20,
      minute: 15,
    });
    assert.equal(planned[0].date.getHours(), 20);
    assert.equal(planned[0].date.getMinutes(), 15);
  });
});
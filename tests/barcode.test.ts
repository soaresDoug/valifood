import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeGtinCheckDigit,
  isBrazilianGtin,
  isPlausibleBarcode,
  isSupportedGtinLength,
  isValidEAN13,
  isValidEAN8,
  isValidGtin,
  isValidUPCA,
  normalizeBarcode,
} from '../src/utils/barcode';

/**
 * Critérios de aceite ligados à leitura: normalizar (remover espaços, validar
 * checksum EAN-13) antes de consultar as APIs — seção 3.3.
 */
describe('utils/barcode', () => {
  it('normaliza removendo espaços e símbolos', () => {
    assert.equal(normalizeBarcode(' 789 1000 100103 '), '7891000100103');
    assert.equal(normalizeBarcode(null), '');
    assert.equal(normalizeBarcode('abc-def'), '');
  });

  it('calcula o dígito verificador módulo 10', () => {
    assert.equal(computeGtinCheckDigit('789100010010'), 3);
    assert.equal(computeGtinCheckDigit('789100020033'), 9);
    assert.equal(computeGtinCheckDigit('400638133393'), 1);
  });

  it('valida EAN-13 conhecido e rejeita o código inválido do mockup', () => {
    assert.equal(isValidEAN13('7891000100103'), true);
    assert.equal(isValidEAN13('7891000200336'), false); // checksum inválido (mockup)
    assert.equal(isValidGtin('7622300336738'), true);
  });

  it('valida EAN-8 e UPC-A', () => {
    assert.equal(isValidEAN8('96385074'), true);
    assert.equal(isValidUPCA('036000291452'), true);
    assert.equal(isValidEAN8('96385075'), false);
  });

  it('reconhece tamanhos suportados e rejeita tamanhos inválidos', () => {
    assert.equal(isSupportedGtinLength('96385074'), true);
    assert.equal(isSupportedGtinLength('7891000100103'), true);
    assert.equal(isSupportedGtinLength('12345'), false);
    assert.equal(isPlausibleBarcode('12345'), false);
    assert.equal(isPlausibleBarcode('0000000000000'), false);
    assert.equal(isPlausibleBarcode('7891000100103'), true);
  });

  it('detecta GTIN brasileiro (prefixo 789/790)', () => {
    assert.equal(isBrazilianGtin('7891000100103'), true);
    assert.equal(isBrazilianGtin('7901234567890'), true);
    assert.equal(isBrazilianGtin('4006381333931'), false);
  });
});
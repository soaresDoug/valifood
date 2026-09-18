/**
 * Utilitários de código de barras (EAN-13 / EAN-8 / UPC-A / GTIN-14).
 * Módulo puro (sem dependências de React Native) para permitir testes unitários.
 */

const ONLY_DIGITS = /\D/g;

/** Remove espaços/símbolos e devolve apenas os dígitos do código. */
export function normalizeBarcode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(ONLY_DIGITS, '');
}

/**
 * Calcula o dígito verificador de um GTIN (algoritmo módulo 10).
 * @param digits corpo do código, sem o dígito verificador
 */
export function computeGtinCheckDigit(digits: string): number {
  const normalized = normalizeBarcode(digits);
  let sum = 0;
  // A partir da direita do corpo, pesos 3 e 1 alternados.
  for (let i = 0; i < normalized.length; i += 1) {
    const positionFromRight = i + 1;
    const digit = Number(normalized[normalized.length - i - 1]);
    sum += positionFromRight % 2 === 1 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

export type GtinLength = 8 | 12 | 13 | 14;

const SUPPORTED_LENGTHS: GtinLength[] = [8, 12, 13, 14];

export function isSupportedGtinLength(code: string): code is string {
  return SUPPORTED_LENGTHS.includes(normalizeBarcode(code).length as GtinLength);
}

/** Valida o dígito verificador de qualquer GTIN suportado. */
export function isValidGtin(raw: string): boolean {
  const code = normalizeBarcode(raw);
  if (!isSupportedGtinLength(code)) return false;
  const body = code.slice(0, -1);
  const check = Number(code.slice(-1));
  return computeGtinCheckDigit(body) === check;
}

export const isValidEAN13 = (raw: string): boolean =>
  normalizeBarcode(raw).length === 13 && isValidGtin(raw);

export const isValidEAN8 = (raw: string): boolean =>
  normalizeBarcode(raw).length === 8 && isValidGtin(raw);

export const isValidUPCA = (raw: string): boolean =>
  normalizeBarcode(raw).length === 12 && isValidGtin(raw);

/**
 * Códigos lidos pela câmera são aceitos mesmo quando o checksum falha
 * (etiquetas danificadas / balanças), mas a UI avisa o usuário. Códigos com
 * tamanho inválido são rejeitados porque certamente não são GTIN.
 */
export function isPlausibleBarcode(raw: string): boolean {
  const code = normalizeBarcode(raw);
  if (!isSupportedGtinLength(code)) return false;
  return !/^0+$/.test(code);
}

/** Prefixo GS1 789/790 identifica produtos fabricados no Brasil. */
export function isBrazilianGtin(raw: string): boolean {
  const code = normalizeBarcode(raw);
  return code.startsWith('789') || code.startsWith('790');
}

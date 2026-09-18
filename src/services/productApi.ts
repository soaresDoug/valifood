/**
 * Consulta de produtos por código de barras (seção 3).
 *
 * Estratégia em cascata:
 *   1. cache local (SQLite)          → `productResolver`
 *   2. Open Food Facts (gratuita)    → `fetchProductFromOpenFoodFacts`
 *   3. Cosmos Bluesoft (fallback)    → `fetchProductFromCosmos`
 *   4. cadastro manual               → tela de fallback (obrigatória)
 */
import type { ResolvedProduct } from '../types';
import { normalizeBarcode } from '../utils/barcode';
import { guessCategoryFromName } from '../utils/categoryGuess';

/**
 * Open Food Facts exige um User-Agent identificando o app (política de uso),
 * caso contrário as requisições podem ser bloqueadas.
 */
export const USER_AGENT = 'ValiFood/1.0.0 (Expo React Native; contato@valifood.app)';
const REQUEST_TIMEOUT_MS = 8000;

export const OPEN_FOOD_FACTS_URL =
  'https://world.openfoodfacts.org/api/v2/product';
export const COSMOS_URL = 'https://api.cosmos.bluesoft.com.br/gtins';

/**
 * Token do Cosmos Bluesoft (opcional). Configure em `.env`:
 * `EXPO_PUBLIC_COSMOS_TOKEN=seu_token`. Sem token o provedor é apenas ignorado
 * e o app cai no cadastro manual — o comportamento offline continua correto.
 */
export const COSMOS_TOKEN = process.env.EXPO_PUBLIC_COSMOS_TOKEN ?? '';

export class ProductApiError extends Error {
  constructor(
    message: string,
    readonly provider: 'openfoodfacts' | 'cosmos',
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ProductApiError';
  }
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_pt?: string;
  generic_name?: string;
  generic_name_pt?: string;
  brands?: string;
  quantity?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_url?: string;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

/** 2ª etapa da cascata: Open Food Facts (gratuita). */
export async function fetchProductFromOpenFoodFacts(
  rawBarcode: string
): Promise<ResolvedProduct | null> {
  const barcode = normalizeBarcode(rawBarcode);
  let payload: unknown;
  try {
    payload = await fetchJson(`${OPEN_FOOD_FACTS_URL}/${barcode}.json`, {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    });
  } catch (error) {
    throw new ProductApiError('Falha ao consultar Open Food Facts', 'openfoodfacts', error);
  }
  if (!payload) return null; // HTTP 404 → não encontrado

  const data = payload as OpenFoodFactsResponse;
  const product = data.product;
  if (!data.status || !product) return null;

  const name = firstNonEmpty(
    product.product_name_pt,
    product.product_name,
    product.generic_name_pt,
    product.generic_name
  );
  if (!name) return null; // sem nome não é útil para o usuário → cadastro manual

  return {
    barcode,
    name,
    imageUrl: firstNonEmpty(
      product.image_front_url,
      product.image_front_small_url,
      product.image_url
    ),
    brand: firstNonEmpty(product.brands),
    quantityLabel: firstNonEmpty(product.quantity),
    category: guessCategoryFromName(name),
    source: 'openfoodfacts',
  };
}

interface CosmosResponse {
  description?: string;
  gtin?: number | string;
  thumbnail?: string;
  brand?: { name?: string };
  ncm?: { description?: string };
  gross_weight?: number;
  net_weight?: number;
}

/** 3ª etapa da cascata: Cosmos Bluesoft (fallback pago, exige token). */
export async function fetchProductFromCosmos(
  rawBarcode: string,
  token: string = COSMOS_TOKEN
): Promise<ResolvedProduct | null> {
  const barcode = normalizeBarcode(rawBarcode);
  if (!token) return null;

  let payload: unknown;
  try {
    payload = await fetchJson(`${COSMOS_URL}/${barcode}.json`, {
      'X-Cosmos-Token': token,
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  } catch (error) {
    throw new ProductApiError('Falha ao consultar Cosmos Bluesoft', 'cosmos', error);
  }
  if (!payload) return null;

  const data = payload as CosmosResponse;
  const name = firstNonEmpty(data.description);
  if (!name) return null;

  return {
    barcode,
    name,
    imageUrl: firstNonEmpty(data.thumbnail?.replace('http://', 'https://')),
    brand: firstNonEmpty(data.brand?.name),
    quantityLabel: null,
    category: guessCategoryFromName(name),
    source: 'cosmos',
  };
}
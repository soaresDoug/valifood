/**
 * Fiação da cascata de resolução com o cache local (SQLite) e as APIs reais.
 * As regras em si ficam em `productLookup` (módulo puro, coberto por testes).
 */
import {
  clearProductCache as clearCacheRows,
  getCachedProduct,
  upsertCachedProduct,
} from '../db/productRepository';
import type { CachedProductRecord, ProductLookupResult, ResolvedProduct } from '../types';
import { normalizeBarcode } from '../utils/barcode';
import { COSMOS_TOKEN, fetchProductFromCosmos, fetchProductFromOpenFoodFacts } from './productApi';
import { lookupProduct, type LookupOptions, type LookupProviders } from './productLookup';

export interface ResolveProductDeps extends LookupOptions {
  now?: () => Date;
}

const DEFAULT_PROVIDERS: LookupProviders = {
  openFoodFacts: fetchProductFromOpenFoodFacts,
  cosmos: fetchProductFromCosmos,
};

function toCached(product: ResolvedProduct, updatedAt: string): CachedProductRecord {
  return { ...product, updatedAt };
}

/** Resolve um código de barras usando cache → Open Food Facts → Cosmos. */
export async function resolveProduct(
  rawBarcode: string,
  deps: ResolveProductDeps = {}
): Promise<ProductLookupResult> {
  const { now = () => new Date(), cosmosToken = COSMOS_TOKEN, ...rest } = deps;

  return lookupProduct(
    rawBarcode,
    DEFAULT_PROVIDERS,
    {
      cosmosToken,
      getCached: (barcode) => getCachedProduct(barcode),
      saveCache: (product) => upsertCachedProduct(toCached(product, now().toISOString())),
      ...rest,
    }
  );
}

/** Salva no cache um produto cadastrado manualmente pelo usuário. */
export function cacheManualProduct(
  barcode: string,
  product: Pick<ResolvedProduct, 'name' | 'imageUrl' | 'category'>,
  now: Date = new Date()
): void {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) return;
  upsertCachedProduct({
    barcode: normalized,
    name: product.name,
    imageUrl: product.imageUrl,
    brand: null,
    quantityLabel: null,
    category: product.category,
    source: 'manual',
    updatedAt: now.toISOString(),
  });
}

export function clearProductCache(): void {
  clearCacheRows();
}

export { lookupProduct } from './productLookup';
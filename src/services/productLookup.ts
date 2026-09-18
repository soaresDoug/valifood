/**
 * Núcleo da cascata de resolução de produto (seção 3.3), com os provedores
 * injetados — assim as regras podem ser testadas sem rede e sem SDK nativo.
 *
 *   1. normalizar e validar o GTIN
 *   2. cache local (quando fornecido)
 *   3. Open Food Facts
 *   4. Cosmos Bluesoft (apenas se houver token)
 *   5. nada encontrado → cadastro manual (status `not_found`)
 *   6. salvar o resultado no cache para as próximas leituras
 */
import type {
  ProductLookupAttempt,
  ProductLookupResult,
  ResolvedProduct,
} from '../types';
import { isPlausibleBarcode, normalizeBarcode } from '../utils/barcode';

export interface LookupProviders {
  openFoodFacts: (barcode: string) => Promise<ResolvedProduct | null>;
  cosmos: (barcode: string) => Promise<ResolvedProduct | null>;
}

export interface LookupOptions {
  cosmosToken?: string;
  getCached?: (barcode: string) => ResolvedProduct | null;
  saveCache?: (product: ResolvedProduct) => void;
  skipCache?: boolean;
}

export async function lookupProduct(
  rawBarcode: string,
  providers: LookupProviders,
  options: LookupOptions = {}
): Promise<ProductLookupResult> {
  const { cosmosToken = '', getCached, saveCache, skipCache = false } = options;
  const barcode = normalizeBarcode(rawBarcode);
  const attempts: ProductLookupAttempt[] = [];

  if (!isPlausibleBarcode(barcode)) {
    return {
      status: 'not_found',
      product: null,
      attempts: [{ provider: 'manual', outcome: 'skipped', detail: 'GTIN inválido' }],
    };
  }

  // 2) Cache local — evita consultar as APIs de novo para o mesmo código.
  if (!skipCache && getCached) {
    try {
      const cached = getCached(barcode);
      if (cached) {
        attempts.push({ provider: cached.source, outcome: 'hit', detail: 'cache local' });
        return { status: 'found', product: { ...cached, barcode }, attempts };
      }
      attempts.push({ provider: 'manual', outcome: 'miss', detail: 'cache local vazio' });
    } catch (error) {
      attempts.push({
        provider: 'manual',
        outcome: 'error',
        detail: error instanceof Error ? error.message : 'falha no cache',
      });
    }
  }

  let sawNetworkError = false;
  const finish = (product: ResolvedProduct): ProductLookupResult => {
    try {
      saveCache?.(product);
    } catch (error) {
      console.warn('[lookup] falha ao salvar no cache', error);
    }
    return { status: 'found', product, attempts };
  };

  // 3) Open Food Facts
  try {
    const product = await providers.openFoodFacts(barcode);
    if (product) {
      attempts.push({ provider: 'openfoodfacts', outcome: 'hit' });
      return finish(product);
    }
    attempts.push({ provider: 'openfoodfacts', outcome: 'miss' });
  } catch (error) {
    sawNetworkError = true;
    attempts.push({
      provider: 'openfoodfacts',
      outcome: 'error',
      detail: error instanceof Error ? error.message : 'erro desconhecido',
    });
  }

  // 4) Cosmos Bluesoft como fallback pago (ignorado sem token)
  if (cosmosToken) {
    try {
      const product = await providers.cosmos(barcode);
      if (product) {
        attempts.push({ provider: 'cosmos', outcome: 'hit' });
        return finish(product);
      }
      attempts.push({ provider: 'cosmos', outcome: 'miss' });
    } catch (error) {
      sawNetworkError = true;
      attempts.push({
        provider: 'cosmos',
        outcome: 'error',
        detail: error instanceof Error ? error.message : 'erro desconhecido',
      });
    }
  } else {
    attempts.push({
      provider: 'cosmos',
      outcome: 'skipped',
      detail: 'EXPO_PUBLIC_COSMOS_TOKEN não configurado',
    });
  }

  // 5) Falha de rede não pode travar o app: segue para o cadastro manual.
  return {
    status: sawNetworkError ? 'offline_error' : 'not_found',
    product: null,
    attempts,
  };
}
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lookupProduct, type LookupProviders } from '../src/services/productLookup';
import type { ResolvedProduct } from '../src/types';

const offProduct: ResolvedProduct = {
  barcode: '7891000100103',
  name: 'Leite Condensado Integral Moça',
  imageUrl: 'https://images.openfoodfacts.org/leite.jpg',
  brand: 'Nestlé',
  quantityLabel: '395 g',
  category: 'laticinios',
  source: 'openfoodfacts',
};

const cosmosProduct: ResolvedProduct = {
  barcode: '7891000100103',
  name: 'Leite Condensado 395g',
  imageUrl: 'https://cdn.cosmos.com.br/leite.jpg',
  brand: 'Nestlé',
  quantityLabel: null,
  category: 'laticinios',
  source: 'cosmos',
};

function providers(overrides: Partial<LookupProviders> = {}): LookupProviders {
  return {
    openFoodFacts: async () => null,
    cosmos: async () => null,
    ...overrides,
  };
}

/** Seção 3.3: cache → Open Food Facts → Cosmos → cadastro manual. */
describe('services/productLookup', () => {
  it('usa o cache local antes de chamar qualquer API', async () => {
    let offCalls = 0;
    const result = await lookupProduct('7891000100103', providers({
      openFoodFacts: async () => {
        offCalls += 1;
        return offProduct;
      },
    }), {
      getCached: () => ({ ...offProduct, updatedAt: '2026-09-18T10:00:00.000Z' }),
    });

    assert.equal(result.status, 'found');
    assert.equal(result.product?.name, offProduct.name);
    assert.equal(result.attempts[0].detail, 'cache local');
    assert.equal(offCalls, 0);
  });

  it('consulta o Open Food Facts quando o cache está vazio e salva o resultado', async () => {
    const saved: ResolvedProduct[] = [];
    const result = await lookupProduct(
      '7891000100103',
      providers({ openFoodFacts: async () => offProduct }),
      { getCached: () => null, saveCache: (product) => saved.push(product) }
    );

    assert.equal(result.status, 'found');
    assert.equal(result.product?.source, 'openfoodfacts');
    assert.equal(saved.length, 1);
    assert.equal(saved[0].barcode, '7891000100103');
  });

  it('cai para o Cosmos quando o Open Food Facts não encontra', async () => {
    let cosmosCalls = 0;
    const result = await lookupProduct(
      '7891000100103',
      providers({
        cosmos: async () => {
          cosmosCalls += 1;
          return cosmosProduct;
        },
      }),
      { cosmosToken: 'token-de-teste' }
    );

    assert.equal(result.status, 'found');
    assert.equal(result.product?.source, 'cosmos');
    assert.equal(cosmosCalls, 1);
    assert.deepEqual(
      result.attempts.map((item) => `${item.provider}:${item.outcome}`),
      ['openfoodfacts:miss', 'cosmos:hit']
    );
  });

  it('não chama o Cosmos quando não há token configurado', async () => {
    let cosmosCalls = 0;
    const result = await lookupProduct(
      '7891000100103',
      providers({
        cosmos: async () => {
          cosmosCalls += 1;
          return cosmosProduct;
        },
      }),
      { cosmosToken: '' }
    );

    assert.equal(cosmosCalls, 0);
    assert.equal(result.status, 'not_found');
    assert.equal(result.attempts[1].outcome, 'skipped');
  });

  it('devolve not_found quando nenhuma API conhece o produto (cadastro manual)', async () => {
    const result = await lookupProduct('7891000100103', providers(), {
      cosmosToken: 'token-de-teste',
    });
    assert.equal(result.status, 'not_found');
    assert.equal(result.product, null);
  });

  it('devolve offline_error quando as APIs falham por rede', async () => {
    const result = await lookupProduct(
      '7891000100103',
      providers({
        openFoodFacts: async () => {
          throw new Error('Network request failed');
        },
        cosmos: async () => {
          throw new Error('Network request failed');
        },
      }),
      { cosmosToken: 'token-de-teste' }
    );

    assert.equal(result.status, 'offline_error');
    assert.equal(result.product, null);
    assert.equal(result.attempts.filter((item) => item.outcome === 'error').length, 2);
  });

  it('rejeita códigos inválidos sem tocar na rede', async () => {
    let calls = 0;
    const result = await lookupProduct(
      '123',
      providers({
        openFoodFacts: async () => {
          calls += 1;
          return offProduct;
        },
      })
    );
    assert.equal(calls, 0);
    assert.equal(result.status, 'not_found');
    assert.equal(result.attempts[0].detail, 'GTIN inválido');
  });

  it('normaliza o código lido pela câmera antes de consultar', async () => {
    let received = '';
    await lookupProduct(
      '789 1000-100103',
      providers({
        openFoodFacts: async (barcode) => {
          received = barcode;
          return null;
        },
      })
    );
    assert.equal(received, '7891000100103');
  });

  it('reconsulta as APIs quando skipCache é verdadeiro', async () => {
    let offCalls = 0;
    const result = await lookupProduct(
      '7891000100103',
      providers({
        openFoodFacts: async () => {
          offCalls += 1;
          return offProduct;
        },
      }),
      {
        skipCache: true,
        getCached: () => ({ ...offProduct, updatedAt: '2026-09-18T10:00:00.000Z' }),
      }
    );
    assert.equal(offCalls, 1);
    assert.equal(result.status, 'found');
  });

  it('não quebra o fluxo se o cache falhar ao gravar', async () => {
    const result = await lookupProduct(
      '7891000100103',
      providers({ openFoodFacts: async () => offProduct }),
      {
        saveCache: () => {
          throw new Error('disco cheio');
        },
      }
    );
    assert.equal(result.status, 'found');
  });
});
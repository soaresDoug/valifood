import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  OPEN_FOOD_FACTS_URL,
  ProductApiError,
  USER_AGENT,
  fetchProductFromCosmos,
  fetchProductFromOpenFoodFacts,
} from '../src/services/productApi';

interface Call {
  url: string;
  headers: Record<string, string>;
}

const calls: Call[] = [];

function stubFetch(response: {
  status: number;
  json?: unknown;
  throwError?: Error;
}): void {
  globalThis.fetch = (async (url: unknown, init?: { headers?: Record<string, string> }) => {
    calls.push({ url: String(url), headers: init?.headers ?? {} });
    if (response.throwError) throw response.throwError;
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.json,
    } as unknown as Response;
  }) as typeof fetch;
}

afterEach(() => {
  calls.length = 0;
});

/** Seção 3.1/3.2: mapeamento das respostas das APIs de produto. */
describe('services/productApi (Open Food Facts)', () => {
  it('mapeia nome, imagem, marca e quantidade', async () => {
    stubFetch({
      status: 200,
      json: {
        status: 1,
        product: {
          product_name: 'Leite condensado',
          product_name_pt: 'Leite Condensado Integral moça',
          brands: 'Nestlé, Moça',
          quantity: '395 g',
          image_front_url: 'https://images.openfoodfacts.org/leite.jpg',
        },
      },
    });

    const product = await fetchProductFromOpenFoodFacts('789 1000 100103');
    assert.ok(product);
    assert.equal(product.name, 'Leite Condensado Integral moça');
    assert.equal(product.brand, 'Nestlé, Moça');
    assert.equal(product.quantityLabel, '395 g');
    assert.equal(product.imageUrl, 'https://images.openfoodfacts.org/leite.jpg');
    assert.equal(product.category, 'laticinios');
    assert.equal(product.source, 'openfoodfacts');
    assert.equal(product.barcode, '7891000100103');
    assert.equal(calls[0].url, `${OPEN_FOOD_FACTS_URL}/7891000100103.json`);
  });

  it('envia o User-Agent customizado exigido pela API', async () => {
    stubFetch({ status: 200, json: { status: 0 } });
    await fetchProductFromOpenFoodFacts('7891000100103');
    assert.equal(calls[0].headers['User-Agent'], USER_AGENT);
    assert.match(USER_AGENT, /ValiFood/);
  });

  it('trata HTTP 404 como produto não encontrado', async () => {
    stubFetch({ status: 404 });
    assert.equal(await fetchProductFromOpenFoodFacts('7891000200336'), null);
  });

  it('trata status 0 como produto não encontrado', async () => {
    stubFetch({ status: 200, json: { status: 0 } });
    assert.equal(await fetchProductFromOpenFoodFacts('7891000100103'), null);
  });

  it('ignora produtos sem nome (cai no cadastro manual)', async () => {
    stubFetch({ status: 200, json: { status: 1, product: { brands: 'Genérico' } } });
    assert.equal(await fetchProductFromOpenFoodFacts('7891000100103'), null);
  });

  it('adivinha a categoria pelo nome do produto', async () => {
    stubFetch({
      status: 200,
      json: { status: 1, product: { product_name: 'Arroz Branco Tipo 1' } },
    });
    const product = await fetchProductFromOpenFoodFacts('7891000100103');
    assert.equal(product?.category, 'graos');
  });

  it('propaga erro de rede como ProductApiError', async () => {
    stubFetch({ status: 0, throwError: new Error('Network request failed') });
    await assert.rejects(
      () => fetchProductFromOpenFoodFacts('7891000100103'),
      (error: unknown) =>
        error instanceof ProductApiError && error.provider === 'openfoodfacts'
    );
  });

  it('propaga erro HTTP inesperado', async () => {
    stubFetch({ status: 500, json: {} });
    await assert.rejects(() => fetchProductFromOpenFoodFacts('7891000100103'));
  });
});

describe('services/productApi (Cosmos Bluesoft)', () => {
  it('não consulta sem token', async () => {
    stubFetch({ status: 200, json: { description: 'Produto' } });
    assert.equal(await fetchProductFromCosmos('7891000100103', ''), null);
    assert.equal(calls.length, 0);
  });

  it('mapeia a resposta e força HTTPS na imagem', async () => {
    stubFetch({
      status: 200,
      json: {
        description: 'Leite Condensado 395g',
        thumbnail: 'http://cdn.cosmos.com.br/leite.jpg',
        brand: { name: 'Nestlé' },
      },
    });
    const product = await fetchProductFromCosmos('7891000100103', 'token-de-teste');
    assert.ok(product);
    assert.equal(product.source, 'cosmos');
    assert.equal(product.imageUrl, 'https://cdn.cosmos.com.br/leite.jpg');
    assert.equal(product.brand, 'Nestlé');
    assert.equal(calls[0].headers['X-Cosmos-Token'], 'token-de-teste');
  });

  it('trata 404 como não encontrado e erro de rede como ProductApiError', async () => {
    stubFetch({ status: 404 });
    assert.equal(await fetchProductFromCosmos('7891000100103', 'token'), null);

    stubFetch({ status: 0, throwError: new Error('timeout') });
    await assert.rejects(
      () => fetchProductFromCosmos('7891000100103', 'token'),
      (error: unknown) => error instanceof ProductApiError && error.provider === 'cosmos'
    );
  });
});
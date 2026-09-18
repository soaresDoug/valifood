/**
 * Heurística de categoria a partir do nome do produto.
 * Módulo puro (sem React Native) porque é usado pelo serviço de consulta de
 * produtos e coberto por testes unitários.
 */
const RULES: Array<{ id: string; keywords: string[] }> = [
  {
    id: 'laticinios',
    keywords: ['leite', 'queijo', 'iogurte', 'requeijao', 'manteiga', 'margarina', 'creme de leite', 'nata', 'mussarela', 'ricota'],
  },
  {
    id: 'carnes',
    keywords: ['frango', 'carne', 'peixe', 'file', 'linguica', 'salsicha', 'bacon', 'picanha', 'patinho', 'hamburguer', 'presunto', 'mortadela'],
  },
  {
    id: 'graos',
    keywords: ['arroz', 'feijao', 'lentilha', 'macarrao', 'farinha', 'aveia', 'granola', 'trigo', 'cereal'],
  },
  {
    id: 'padaria',
    keywords: ['pao', 'bolo', 'biscoito', 'bolacha', 'torrada', 'croissant', 'wafer'],
  },
  {
    id: 'hortifruti',
    keywords: ['banana', 'maca', 'laranja', 'alface', 'tomate', 'batata', 'cenoura', 'fruta', 'legume'],
  },
  {
    id: 'bebidas',
    keywords: ['refrigerante', 'suco', 'agua', 'cerveja', 'vinho', 'cha', 'energetico', 'cafe', 'coca'],
  },
  { id: 'congelados', keywords: ['congelado', 'sorvete', 'polpa', 'nuggets', 'lasanha'] },
  {
    id: 'mercearia',
    keywords: ['acucar', 'sal', 'oleo', 'azeite', 'molho', 'extrato', 'milho', 'atum', 'sardinha', 'chocolate', 'achocolatado'],
  },
  {
    id: 'limpeza',
    keywords: ['detergente', 'sabao', 'amaciante', 'desinfetante', 'alvejante', 'multiuso', 'esponja'],
  },
  {
    id: 'higiene',
    keywords: ['shampoo', 'condicionador', 'sabonete', 'pasta de dente', 'creme dental', 'desodorante', 'papel higienico', 'fralda', 'absorvente'],
  },
];

export const FALLBACK_CATEGORY_ID = 'outros';

/** Remove acentos e caixa para comparar palavras-chave em pt-BR. */
export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Adivinha a categoria a partir do nome retornado pela API de produtos
 * (Open Food Facts e Cosmos não compartilham a mesma taxonomia).
 */
export function guessCategoryFromName(name: string): string {
  const normalized = normalizeForMatch(name);
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.id;
    }
  }
  return FALLBACK_CATEGORY_ID;
}
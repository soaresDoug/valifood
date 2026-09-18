import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export type CategoryIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface ProductCategory {
  id: string;
  label: string;
  icon: CategoryIconName;
  color: string;
}

/**
 * Categorias usadas no cadastro e nos ícones da lista (as cores seguem a
 * paleta de ícones do design: carnes vermelho, laticínios amarelo, etc.).
 */
export const CATEGORIES: ProductCategory[] = [
  { id: 'laticinios', label: 'Laticínios', icon: 'cup-water', color: colors.categoryDairy },
  { id: 'carnes', label: 'Carnes e aves', icon: 'food-drumstick', color: colors.categoryMeat },
  { id: 'graos', label: 'Grãos e cereais', icon: 'rice', color: colors.categoryGrains },
  { id: 'padaria', label: 'Padaria', icon: 'bread-slice', color: colors.categoryBakery },
  { id: 'hortifruti', label: 'Hortifrúti', icon: 'food-apple', color: colors.categoryProduce },
  { id: 'bebidas', label: 'Bebidas', icon: 'bottle-soda', color: colors.categoryDrinks },
  { id: 'congelados', label: 'Congelados', icon: 'snowflake', color: colors.categoryDrinks },
  { id: 'mercearia', label: 'Mercearia', icon: 'food-variant', color: colors.categoryCheese },
  { id: 'limpeza', label: 'Limpeza', icon: 'spray-bottle', color: colors.categoryCleaning },
  { id: 'higiene', label: 'Higiene e beleza', icon: 'toothbrush', color: colors.categoryHygiene },
  { id: 'outros', label: 'Outros', icon: 'package-variant-closed', color: colors.categoryOther },
];

export const DEFAULT_CATEGORY_ID = 'outros';

export function getCategory(id: string | null | undefined): ProductCategory {
  if (!id) return CATEGORIES[CATEGORIES.length - 1];
  return (
    CATEGORIES.find((category) => category.id === id) ??
    CATEGORIES[CATEGORIES.length - 1]
  );
}

// A heurística vive em `utils/categoryGuess` (módulo puro, sem dependências de
// React Native) para poder ser testada unitariamente; aqui só reexportamos.
export { guessCategoryFromName } from '../utils/categoryGuess';

export const UNITS: Array<{ value: string; label: string }> = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
];

export function getUnitLabel(unit: string): string {
  const found = UNITS.find((item) => item.value === unit);
  if (!found) return unit;
  return found.label.includes('(') ? found.label.split(' (')[1].replace(')', '') : found.label;
}
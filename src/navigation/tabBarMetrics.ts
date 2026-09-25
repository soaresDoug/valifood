/**
 * Métricas verticais da barra inferior (telas 3, 8 e 9).
 *
 * Contexto do bug corrigido: o `@react-navigation/bottom-tabs` v7 calcula a altura
 * final da barra em `getTabBarHeight()`. Se houver um `height` NUMÉRICO no
 * `tabBarStyle`, ele é usado como altura final e o inset inferior do sistema
 * continua sendo aplicado como `paddingBottom` na mesma view. Ou seja: a altura
 * precisa INCLUIR o inset (o default da lib é `49 + inset`).
 *
 * Com `height: 84` fixo no iOS o conteúdo útil ficava em `84 - 34 = 50px` e o
 * `paddingBottom: 24` do `tabBarItemStyle` consumia mais 24px, sobrando ~10px
 * para ícone (25px) + rótulo (16px) — o texto era cortado na base no iPhone
 * (home indicator de 34px). No Android, com inset 0, sobravam ~40px e o corte
 * passava despercebido.
 *
 * Este módulo concentra a conta para que ela seja testável sem device
 * (`tests/tabBarMetrics.test.ts`) e para impedir regressão.
 */
export type TabBarPlatform = 'ios' | 'android';

/** Altura útil da barra (sem o inset inferior do sistema). */
export const TAB_BAR_CONTENT_HEIGHT: Record<TabBarPlatform, number> = {
  ios: 52,
  android: 64,
};

/** Ícone da aba focada / não focada. */
export const TAB_BAR_ICON_SIZE = 24;
export const TAB_BAR_ICON_SIZE_INACTIVE = 22;

/** Rótulo abaixo do ícone (mesma métrica da variante `tiny`: 11/14). */
export const TAB_BAR_LABEL_LINE_HEIGHT = 14;
export const TAB_BAR_LABEL_MARGIN_TOP = 2;

/** Padding interno que a lib aplica dentro de cada item (`tabVerticalUiKit`: padding 5). */
export const TAB_BAR_ITEM_INTERNAL_PADDING = 10;

export interface TabBarLayout {
  /** Valor de `height` para o `tabBarStyle` — já inclui o inset inferior. */
  height: number;
  /** Altura útil sem o inset. */
  contentHeight: number;
  /** Respiro superior do item, para centralizar ícone + rótulo no espaço disponível. */
  itemPaddingTop: number;
  /** Espaço vertical que sobra para ícone + rótulo. */
  availableForIconAndLabel: number;
  /** Espaço vertical que ícone + rótulo exigem. */
  requiredForIconAndLabel: number;
  /** `false` indica risco de corte do rótulo (regressão). */
  fits: boolean;
}

export interface TabBarLayoutInput {
  platform: TabBarPlatform;
  bottomInset: number;
}

/**
 * Calcula a altura e o respiro dos itens da barra inferior.
 *
 * `height` inclui o inset porque a lib aplica o inset como `paddingBottom` na
 * mesma view — somar o inset aqui evita que o conteúdo seja espremido.
 */
export function getTabBarLayout({ platform, bottomInset }: TabBarLayoutInput): TabBarLayout {
  const contentHeight = TAB_BAR_CONTENT_HEIGHT[platform];
  const availableForIconAndLabel = contentHeight - TAB_BAR_ITEM_INTERNAL_PADDING;
  const requiredForIconAndLabel =
    TAB_BAR_ICON_SIZE + TAB_BAR_LABEL_MARGIN_TOP + TAB_BAR_LABEL_LINE_HEIGHT;
  const slack = availableForIconAndLabel - requiredForIconAndLabel;

  return {
    height: contentHeight + Math.max(0, bottomInset),
    contentHeight,
    itemPaddingTop: Math.max(0, Math.floor(slack / 2)),
    availableForIconAndLabel,
    requiredForIconAndLabel,
    fits: slack >= 0,
  };
}

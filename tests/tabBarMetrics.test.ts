import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TAB_BAR_ICON_SIZE,
  TAB_BAR_LABEL_LINE_HEIGHT,
  TAB_BAR_LABEL_MARGIN_TOP,
  getTabBarLayout,
  type TabBarPlatform,
} from '../src/navigation/tabBarMetrics';

/**
 * A barra inferior quebrava no iPhone (rótulo cortado na base): `height` fixo em
 * 84 no iOS + `paddingBottom: 24` no item deixavam ~10px para ícone + rótulo.
 * Estes testes travam a conta correta (altura = conteúdo + inset).
 */
describe('navigation/tabBarMetrics', () => {
  const platforms: TabBarPlatform[] = ['ios', 'android'];
  const insets = [0, 21, 34, 48]; // iPhone SE, iPhone XR, iPhone 11/15, iPad/Android com barra

  it('inclui o inset inferior na altura final (o height do tabBarStyle é a altura final)', () => {
    assert.equal(getTabBarLayout({ platform: 'ios', bottomInset: 34 }).height, 86);
    assert.equal(getTabBarLayout({ platform: 'ios', bottomInset: 0 }).height, 52);
    assert.equal(getTabBarLayout({ platform: 'android', bottomInset: 0 }).height, 64);
    assert.equal(getTabBarLayout({ platform: 'android', bottomInset: 24 }).height, 88);
  });

  it('sobra espaço para ícone e rótulo em qualquer inset', () => {
    const required = TAB_BAR_ICON_SIZE + TAB_BAR_LABEL_MARGIN_TOP + TAB_BAR_LABEL_LINE_HEIGHT;

    for (const platform of platforms) {
      for (const bottomInset of insets) {
        const layout = getTabBarLayout({ platform, bottomInset });
        assert.ok(layout.fits, `${platform}/${bottomInset} não cabe na barra`);
        assert.equal(layout.requiredForIconAndLabel, required);
        assert.ok(
          layout.availableForIconAndLabel >= required,
          `${platform}/${bottomInset}: disponível ${layout.availableForIconAndLabel} < ${required}`
        );
      }
    }
  });

  it('centraliza ícone + rótulo no espaço disponível', () => {
    for (const platform of platforms) {
      for (const bottomInset of insets) {
        const layout = getTabBarLayout({ platform, bottomInset });

        // topo = respiro do item + padding interno do item (5)
        const top = layout.itemPaddingTop + 5;
        // base = padding interno do item (5) + sobra que restou dentro do botão
        const bottom =
          5 + (layout.availableForIconAndLabel - layout.requiredForIconAndLabel) - layout.itemPaddingTop;

        assert.ok(top >= 4, `${platform}/${bottomInset}: topo ${top} muito apertado`);
        assert.ok(bottom >= 4, `${platform}/${bottomInset}: base ${bottom} muito apertada`);
        assert.ok(Math.abs(top - bottom) <= 1, `${platform}/${bottomInset}: topo ${top} x base ${bottom}`);
      }
    }
  });

  it('documenta a falha anterior: height fixo 84 no iOS não caberia nem sem o respiro extra', () => {
    const required = TAB_BAR_ICON_SIZE + TAB_BAR_LABEL_MARGIN_TOP + TAB_BAR_LABEL_LINE_HEIGHT;

    // altura fixa 84 - inset 34 (home indicator) - paddingTop 6 da barra
    // - paddingBottom 24 do item - padding interno 10 do item
    const oldAvailable = 84 - 34 - 6 - 24 - 10;

    assert.equal(oldAvailable, 10);
    assert.ok(oldAvailable < required, 'a barra antiga não tinha espaço para o rótulo');
  });
});

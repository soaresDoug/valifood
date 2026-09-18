export { colors, urgencyColors, type UrgencyLevel } from './colors';
export {
  fontFamily,
  fontFamilyFallback,
  textVariants,
  type TextVariant,
} from './typography';
export { spacing, radii, screenPadding, shadows, hitSlop } from './layout';

import { colors } from './colors';
import { spacing, radii } from './layout';
import { textVariants } from './typography';

export const theme = { colors, spacing, radii, textVariants } as const;
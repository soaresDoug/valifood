/** Modelo de dados local do ValiFood (ver seção 6 da especificação). */

export type ProductSource = 'openfoodfacts' | 'cosmos' | 'manual';

export type ReminderFrequency =
  | 'daily'
  | 'every_3_days'
  | 'weekly'
  | '1_day_before'
  | 'custom';

export type ProductStatus = 'active' | 'consumed' | 'discarded' | 'expired';

export type MeasurementUnit = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'pacote' | 'caixa';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  imageUrl: string | null;
  source: ProductSource;
  category: string;
  quantity: number;
  unit: MeasurementUnit;
  expirationDate: string; // ISO (yyyy-mm-dd)
  reminderFrequency: ReminderFrequency;
  customIntervalDays: number | null;
  status: ProductStatus;
  notificationIds: string[];
  createdAt: string; // ISO datetime
  consumedAt: string | null;
  discardedAt: string | null;
}

/** Entrada para criação de um produto (id / status / createdAt são gerados). */
export type ProductInput = Omit<
  Product,
  'id' | 'status' | 'createdAt' | 'consumedAt' | 'discardedAt' | 'notificationIds'
> &
  Partial<Pick<Product, 'notificationIds'>>;

/** Produto resolvido por API/cache, ainda sem validade e frequência. */
export interface ResolvedProduct {
  barcode: string;
  name: string;
  imageUrl: string | null;
  brand: string | null;
  quantityLabel: string | null;
  category: string;
  source: ProductSource;
}

export interface ProductLookupResult {
  status: 'found' | 'not_found' | 'offline_error';
  product: ResolvedProduct | null;
  /** Erro por provedor, útil para diagnóstico e para a tela de fallback manual. */
  attempts: ProductLookupAttempt[];
}

export interface ProductLookupAttempt {
  provider: ProductSource;
  outcome: 'hit' | 'miss' | 'error' | 'skipped';
  detail?: string;
}

export interface CachedProductRecord extends ResolvedProduct {
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
  notificationsEnabled: boolean;
}

export interface AppSettings {
  onboardingDone: boolean;
  defaultReminderFrequency: ReminderFrequency;
  defaultReminderHour: number;
  defaultReminderMinute: number;
  expireAlertEnabled: boolean;
}

export interface ProductStats {
  active: number;
  consumed: number;
  discarded: number;
  expired: number;
  expiringSoon: number;
}

/** Rótulos de status usados na UI (tela de estoque / histórico). */
export const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Em estoque',
  consumed: 'Consumido',
  discarded: 'Descartado',
  expired: 'Vencido',
};

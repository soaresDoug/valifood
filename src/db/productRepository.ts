import { getDatabase } from './database';
import type {
  CachedProductRecord,
  MeasurementUnit,
  Product,
  ProductSource,
  ProductStatus,
  ReminderFrequency,
} from '../types';

interface ProductRow {
  id: string;
  barcode: string;
  name: string;
  image_url: string | null;
  source: string;
  category: string;
  quantity: number;
  unit: string;
  expiration_date: string;
  reminder_frequency: string;
  custom_interval_days: number | null;
  status: string;
  notification_ids: string;
  created_at: string;
  consumed_at: string | null;
  discarded_at: string | null;
}

interface CacheRow {
  barcode: string;
  name: string;
  image_url: string | null;
  brand: string | null;
  quantity_label: string | null;
  category: string;
  source: string;
  updated_at: string;
}

/**
 * Repositório dos produtos cadastrados (seção 6).
 * Usa a API síncrona do `expo-sqlite` — o banco é pequeno e local, então não há
 * necessidade de estados de carregamento entre JS e SQLite.
 */
function mapRow(row: ProductRow): Product {
  let notificationIds: string[] = [];
  try {
    const parsed = JSON.parse(row.notification_ids || '[]');
    if (Array.isArray(parsed)) {
      notificationIds = parsed.filter((item): item is string => typeof item === 'string');
    }
  } catch {
    notificationIds = [];
  }
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    imageUrl: row.image_url,
    source: row.source as ProductSource,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit as MeasurementUnit,
    expirationDate: row.expiration_date,
    reminderFrequency: row.reminder_frequency as ReminderFrequency,
    customIntervalDays: row.custom_interval_days,
    status: row.status as ProductStatus,
    notificationIds,
    createdAt: row.created_at,
    consumedAt: row.consumed_at,
    discardedAt: row.discarded_at,
  };
}

function mapCacheRow(row: CacheRow): CachedProductRecord {
  return {
    barcode: row.barcode,
    name: row.name,
    imageUrl: row.image_url,
    brand: row.brand,
    quantityLabel: row.quantity_label,
    category: row.category,
    source: row.source as ProductSource,
    updatedAt: row.updated_at,
  };
}

/* ------------------------------- Leituras -------------------------------- */

/** Produtos ativos ordenados pela validade mais próxima (Home / Estoque). */
export function listProducts(status?: ProductStatus): Product[] {
  const db = getDatabase();
  const rows = status
    ? db.getAllSync<ProductRow>(
        `SELECT * FROM products WHERE status = ?
         ORDER BY expiration_date ASC, created_at ASC`,
        [status]
      )
    : db.getAllSync<ProductRow>(
        `SELECT * FROM products ORDER BY expiration_date ASC, created_at ASC`
      );
  return rows.map(mapRow);
}

export function getProductById(id: string): Product | null {
  const row = getDatabase().getFirstSync<ProductRow>(
    `SELECT * FROM products WHERE id = ?`,
    [id]
  );
  return row ? mapRow(row) : null;
}

export function findActiveProductByBarcode(barcode: string): Product | null {
  const row = getDatabase().getFirstSync<ProductRow>(
    `SELECT * FROM products WHERE barcode = ? AND status = 'active'
     ORDER BY expiration_date ASC LIMIT 1`,
    [barcode]
  );
  return row ? mapRow(row) : null;
}

/** Produtos cuja validade já passou e que ainda constam como ativos. */
export function listOverdueProducts(todayISO: string): Product[] {
  const db = getDatabase();
  const rows = db.getAllSync<ProductRow>(
    `SELECT * FROM products WHERE status = 'active' AND expiration_date < ?
     ORDER BY expiration_date ASC`,
    [todayISO]
  );
  return rows.map(mapRow);
}

export function countProducts(status?: ProductStatus): number {
  const db = getDatabase();
  const row = status
    ? db.getFirstSync<{ total: number }>(
        `SELECT COUNT(*) as total FROM products WHERE status = ?`,
        [status]
      )
    : db.getFirstSync<{ total: number }>(`SELECT COUNT(*) as total FROM products`);
  return row?.total ?? 0;
}

/* ------------------------------- Escritas -------------------------------- */

export function insertProduct(product: Product): Product {
  getDatabase().runSync(
    `INSERT INTO products (
       id, barcode, name, image_url, source, category, quantity, unit,
       expiration_date, reminder_frequency, custom_interval_days, status,
       notification_ids, created_at, consumed_at, discarded_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      product.id,
      product.barcode,
      product.name,
      product.imageUrl,
      product.source,
      product.category,
      product.quantity,
      product.unit,
      product.expirationDate,
      product.reminderFrequency,
      product.customIntervalDays,
      product.status,
      JSON.stringify(product.notificationIds),
      product.createdAt,
      product.consumedAt,
      product.discardedAt,
    ]
  );
  return product;
}

export type ProductPatch = Partial<
  Pick<
    Product,
    | 'name'
    | 'imageUrl'
    | 'category'
    | 'quantity'
    | 'unit'
    | 'expirationDate'
    | 'reminderFrequency'
    | 'customIntervalDays'
    | 'status'
    | 'notificationIds'
    | 'consumedAt'
    | 'discardedAt'
  >
>;

const PATCH_COLUMNS: Record<keyof ProductPatch, string> = {
  name: 'name',
  imageUrl: 'image_url',
  category: 'category',
  quantity: 'quantity',
  unit: 'unit',
  expirationDate: 'expiration_date',
  reminderFrequency: 'reminder_frequency',
  customIntervalDays: 'custom_interval_days',
  status: 'status',
  notificationIds: 'notification_ids',
  consumedAt: 'consumed_at',
  discardedAt: 'discarded_at',
};

export function updateProduct(id: string, patch: ProductPatch): void {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined) as Array<
    [keyof ProductPatch, ProductPatch[keyof ProductPatch]]
  >;
  if (entries.length === 0) return;
  const assignments = entries.map(([key]) => `${PATCH_COLUMNS[key]} = ?`).join(', ');
  const values = entries.map(([key, value]) =>
    key === 'notificationIds' ? JSON.stringify(value ?? []) : (value as string | number | null)
  );
  getDatabase().runSync(`UPDATE products SET ${assignments} WHERE id = ?;`, [...values, id]);
}

/** Salva os ids das notificações agendadas para permitir cancelamento futuro. */
export function updateProductNotificationIds(id: string, notificationIds: string[]): void {
  updateProduct(id, { notificationIds });
}

export function deleteProduct(id: string): void {
  getDatabase().runSync(`DELETE FROM products WHERE id = ?;`, [id]);
}

/** Ids de notificação de todos os produtos com status ativo (orçamento global). */
export function listScheduledNotificationIds(): string[] {
  const rows = getDatabase().getAllSync<{ notification_ids: string }>(
    `SELECT notification_ids FROM products WHERE status = 'active'`
  );
  return rows.flatMap((row) => {
    try {
      const parsed = JSON.parse(row.notification_ids || '[]');
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });
}

/* --------------------------- Cache de produtos ---------------------------- */

export function getCachedProduct(barcode: string): CachedProductRecord | null {
  const row = getDatabase().getFirstSync<CacheRow>(
    `SELECT * FROM product_cache WHERE barcode = ?`,
    [barcode]
  );
  return row ? mapCacheRow(row) : null;
}

export function upsertCachedProduct(record: CachedProductRecord): void {
  getDatabase().runSync(
    `INSERT INTO product_cache (
       barcode, name, image_url, brand, quantity_label, category, source, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(barcode) DO UPDATE SET
       name = excluded.name,
       image_url = excluded.image_url,
       brand = excluded.brand,
       quantity_label = excluded.quantity_label,
       category = excluded.category,
       source = excluded.source,
       updated_at = excluded.updated_at;`,
    [
      record.barcode,
      record.name,
      record.imageUrl,
      record.brand,
      record.quantityLabel,
      record.category,
      record.source,
      record.updatedAt,
    ]
  );
}

export function clearProductCache(): void {
  getDatabase().execSync('DELETE FROM product_cache;');
}

export function countCachedProducts(): number {
  return (
    getDatabase().getFirstSync<{ total: number }>(
      `SELECT COUNT(*) as total FROM product_cache`
    )?.total ?? 0
  );
}

/* -------------------------------- Ajustes -------------------------------- */

export function getSetting<T>(key: string, fallback: T): T {
  const row = getDatabase().getFirstSync<{ value: string }>(
    `SELECT value FROM settings WHERE key = ?`,
    [key]
  );
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setSetting(key: string, value: unknown): void {
  getDatabase().runSync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, JSON.stringify(value)]
  );
}

export function removeSetting(key: string): void {
  getDatabase().runSync(`DELETE FROM settings WHERE key = ?;`, [key]);
}
import * as SQLite from 'expo-sqlite';

/**
 * Banco local (seção 2 e 6 da especificação): SQLite via `expo-sqlite`.
 * Tudo é local-first — apenas a consulta inicial à API de produtos precisa de
 * rede, todas as demais ações funcionam offline.
 */
export const DATABASE_NAME = 'valifood.db';

let database: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: string[] = [
  /* v1 */ `
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      barcode TEXT NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      source TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'outros',
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'un',
      expiration_date TEXT NOT NULL,
      reminder_frequency TEXT NOT NULL DEFAULT 'every_3_days',
      custom_interval_days INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      notification_ids TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      consumed_at TEXT,
      discarded_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_products_status_expiration
      ON products (status, expiration_date);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

    CREATE TABLE IF NOT EXISTS product_cache (
      barcode TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT,
      brand TEXT,
      quantity_label TEXT,
      category TEXT NOT NULL DEFAULT 'outros',
      source TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `,
];

function migrate(db: SQLite.SQLiteDatabase): void {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = row?.user_version ?? 0;
  for (let version = currentVersion; version < MIGRATIONS.length; version += 1) {
    db.withTransactionSync(() => {
      db.execSync(MIGRATIONS[version]);
    });
    db.execSync(`PRAGMA user_version = ${version + 1};`);
  }
}

/** Abre (uma única vez) o banco local e aplica as migrações pendentes. */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (database) return database;
  const db = SQLite.openDatabaseSync(DATABASE_NAME);
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');
  migrate(db);
  database = db;
  return db;
}

/** Usado nos testes de integração: remove todas as linhas mantendo o schema. */
export function resetDatabase(): void {
  const db = getDatabase();
  db.execSync('DELETE FROM products; DELETE FROM product_cache; DELETE FROM settings;');
}

export type { SQLite };

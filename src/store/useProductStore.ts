import { create } from 'zustand';
import { DEFAULT_REMINDER_FREQUENCY } from '../constants/reminders';
import * as repo from '../db/productRepository';
import {
  cancelProductNotifications,
  rebuildAllSchedules,
  scheduleProductNotifications,
} from '../services/notifications';
import type { Product, ProductInput, ProductStats } from '../types';
import { startOfDay, toISODate } from '../utils/dates';
import { createId } from '../utils/id';

export interface ProductState {
  products: Product[];
  hydrated: boolean;
  lastRebuild: { total: number; dropped: number } | null;
  hydrate: () => Promise<void>;
  reload: () => void;
  addProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (
    id: string,
    patch: repo.ProductPatch & { reschedule?: boolean }
  ) => Promise<Product | null>;
  markConsumed: (id: string) => Promise<void>;
  markDiscarded: (id: string) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  /** Reagenda tudo (boot, retorno do background e edições). */
  refreshSchedules: () => Promise<{ total: number; dropped: number }>;
  /** Marca como vencidos os produtos cuja validade já passou. */
  reconcileExpired: () => number;
}

const CLOSED_STATUSES = ['consumed', 'discarded'];

/** Ordena por urgência: o que vence primeiro aparece primeiro (seção 4.3). */
export function sortByExpiration(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    if (a.expirationDate === b.expirationDate) {
      return a.createdAt.localeCompare(b.createdAt);
    }
    return a.expirationDate.localeCompare(b.expirationDate);
  });
}

/** Itens que ainda estão na despensa (ativos ou vencidos sem decisão). */
export function selectInStock(products: Product[]): Product[] {
  return sortByExpiration(
    products.filter((product) => product.status === 'active' || product.status === 'expired')
  );
}

export function selectHistory(products: Product[]): Product[] {
  return [...products]
    .filter((product) => CLOSED_STATUSES.includes(product.status))
    .sort((a, b) => {
      const aDate = a.consumedAt ?? a.discardedAt ?? a.createdAt;
      const bDate = b.consumedAt ?? b.discardedAt ?? b.createdAt;
      return bDate.localeCompare(aDate);
    });
}

export function computeStats(products: Product[], now: Date = new Date()): ProductStats {
  const todayISO = toISODate(startOfDay(now));
  const inSevenDays = toISODate(new Date(startOfDay(now).getTime() + 7 * 86400000));
  return products.reduce<ProductStats>(
    (acc, product) => {
      if (product.status === 'consumed') acc.consumed += 1;
      else if (product.status === 'discarded') acc.discarded += 1;
      else if (product.status === 'expired') acc.expired += 1;
      else acc.active += 1;

      if (
        !CLOSED_STATUSES.includes(product.status) &&
        product.expirationDate >= todayISO &&
        product.expirationDate <= inSevenDays
      ) {
        acc.expiringSoon += 1;
      }
      return acc;
    },
    { active: 0, consumed: 0, discarded: 0, expired: 0, expiringSoon: 0 }
  );
}

export const selectProductById = (id: string) => (state: ProductState) =>
  state.products.find((product) => product.id === id) ?? null;

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  hydrated: false,
  lastRebuild: null,

  /** Carrega o banco local, corrige status vencidos e reconstrói a agenda. */
  hydrate: async () => {
    set({ products: repo.listProducts(), hydrated: true });
    get().reconcileExpired();
    await get().refreshSchedules();
  },

  reload: () => set({ products: repo.listProducts() }),

  addProduct: async (input) => {
    const product: Product = {
      id: createId(),
      barcode: input.barcode,
      name: input.name,
      imageUrl: input.imageUrl,
      source: input.source,
      category: input.category,
      quantity: input.quantity,
      unit: input.unit,
      expirationDate: input.expirationDate,
      reminderFrequency: input.reminderFrequency ?? DEFAULT_REMINDER_FREQUENCY,
      customIntervalDays: input.customIntervalDays ?? null,
      status: 'active',
      notificationIds: [],
      createdAt: new Date().toISOString(),
      consumedAt: null,
      discardedAt: null,
    };

    repo.insertProduct(product);
    // Agenda imediatamente os lembretes e persiste os ids (seção 5.2).
    const notificationIds = await scheduleProductNotifications(product);
    repo.updateProductNotificationIds(product.id, notificationIds);
    set({ products: repo.listProducts() });
    return { ...product, notificationIds };
  },

  updateProduct: async (id, patch) => {
    const { reschedule = true, ...rest } = patch;
    const previous = repo.getProductById(id);
    if (!previous) return null;

    // Regra 5.4: se o produto saiu do estoque, cancela tudo que estava pendente.
    const closing = typeof rest.status === 'string' && CLOSED_STATUSES.includes(rest.status);
    if (closing) {
      await cancelProductNotifications(previous);
      rest.notificationIds = [];
    }

    repo.updateProduct(id, rest);
    let updated = repo.getProductById(id);

    if (updated && reschedule && !closing) {
      // Regra 5.4: cancelar os lembretes antigos e reagendar do zero.
      const notificationIds = await scheduleProductNotifications(updated);
      repo.updateProductNotificationIds(id, notificationIds);
      updated = repo.getProductById(id);
    }

    set({ products: repo.listProducts() });
    return updated;
  },

  markConsumed: async (id) => {
    await get().updateProduct(id, {
      status: 'consumed',
      consumedAt: new Date().toISOString(),
      reschedule: false,
    });
  },

  markDiscarded: async (id) => {
    await get().updateProduct(id, {
      status: 'discarded',
      discardedAt: new Date().toISOString(),
      reschedule: false,
    });
  },

  removeProduct: async (id) => {
    const product = repo.getProductById(id);
    if (product) {
      // Critério de aceite: excluir cancela 100% das notificações pendentes.
      await cancelProductNotifications(product);
    }
    repo.deleteProduct(id);
    set({ products: repo.listProducts() });
  },

  refreshSchedules: async () => {
    const result = await rebuildAllSchedules(get().products);
    for (const [productId, ids] of result.byProduct.entries()) {
      repo.updateProductNotificationIds(productId, ids);
    }
    const summary = { total: result.totalScheduled, dropped: result.dropped };
    set({ products: repo.listProducts(), lastRebuild: summary });
    return summary;
  },

  reconcileExpired: () => {
    const overdue = repo.listOverdueProducts(toISODate(new Date()));
    if (overdue.length === 0) return 0;
    for (const product of overdue) {
      repo.updateProduct(product.id, { status: 'expired' });
    }
    set({ products: repo.listProducts() });
    return overdue.length;
  },
}));
/** App configuration. Provides typed accessors used by pricing/order logic. */
import { settingRepository } from '@/repositories/audit.repository';
import type { Prisma } from '@/core/db/prisma';

export interface StoreConfig {
  storeName: string;
  isOpen: boolean;
  deliveryFee: number;
  freeDeliveryAboveSubtotal: number;
  minOrderSubtotal: number;
  codEnabled: boolean;
  supportPhone: string;
}

const DEFAULTS: StoreConfig = {
  storeName: 'Natural greenkart',
  isOpen: true,
  deliveryFee: 25,
  freeDeliveryAboveSubtotal: 299,
  minOrderSubtotal: 99,
  codEnabled: true,
  supportPhone: '1800-200-300',
};

export const settingsService = {
  async getAll() {
    const rows = await settingRepository.list();
    return rows.map((r) => ({ key: r.key, value: r.value }));
  },

  /** Resolve the strongly-typed store config, falling back to sane defaults. */
  async getStoreConfig(): Promise<StoreConfig> {
    const rows = await settingRepository.list();
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const num = (k: string, d: number) => (typeof map.get(k) === 'number' ? (map.get(k) as number) : d);
    const bool = (k: string, d: boolean) => (typeof map.get(k) === 'boolean' ? (map.get(k) as boolean) : d);
    const str = (k: string, d: string) => (typeof map.get(k) === 'string' ? (map.get(k) as string) : d);

    return {
      storeName: str('store.name', DEFAULTS.storeName),
      isOpen: bool('store.isOpen', DEFAULTS.isOpen),
      deliveryFee: num('delivery.fee', DEFAULTS.deliveryFee),
      freeDeliveryAboveSubtotal: num('delivery.freeAboveSubtotal', DEFAULTS.freeDeliveryAboveSubtotal),
      minOrderSubtotal: num('order.minSubtotal', DEFAULTS.minOrderSubtotal),
      codEnabled: bool('order.codEnabled', DEFAULTS.codEnabled),
      supportPhone: str('support.phone', DEFAULTS.supportPhone),
    };
  },

  update(key: string, value: Prisma.InputJsonValue) {
    return settingRepository.upsert(key, value);
  },
};

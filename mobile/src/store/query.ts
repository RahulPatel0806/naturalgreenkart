import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx); retry transient/network errors twice.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/** Centralised query keys to keep cache invalidation consistent. */
export const queryKeys = {
  config: ['config'] as const,
  categories: ['categories'] as const,
  banners: ['offers', 'banners'] as const,
  adminCoupons: ['admin', 'coupons'] as const,
  adminBanners: ['admin', 'banners'] as const,
  products: (params: Record<string, unknown>) => ['products', params] as const,
  product: (id: string) => ['product', id] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  addresses: ['addresses'] as const,
  notifications: ['notifications'] as const,
  sellerDashboard: ['seller', 'dashboard'] as const,
  sellerProducts: (params: Record<string, unknown>) => ['seller', 'products', params] as const,
  sellerOrders: (params: Record<string, unknown>) => ['seller', 'orders', params] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminUsers: (params: Record<string, unknown>) => ['admin', 'users', params] as const,
  adminOrders: (params: Record<string, unknown>) => ['admin', 'orders', params] as const,
};

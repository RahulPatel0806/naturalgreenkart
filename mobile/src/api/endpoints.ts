/** Thin, typed wrappers over each backend endpoint. UI/hooks call these. */
import { api, unwrap, unwrapWithMeta } from './client';
import type {
  Address,
  AdminDashboard,
  AuthResult,
  CartSummary,
  Category,
  ManagedUser,
  Notification,
  Order,
  Pagination,
  Product,
  SellerDashboard,
  StoreConfig,
  AuthUser,
} from '@/types/api';

type Page<T> = { data: T[]; meta?: { pagination?: Pagination; unread?: number } };

// ── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  requestOtp: (phone: string) =>
    unwrap<{ message: string; resendIn: number; devCode?: string }>(api.post('/auth/request-otp', { phone })),
  verifyOtp: (phone: string, code: string, name?: string) =>
    unwrap<AuthResult>(api.post('/auth/verify-otp', { phone, code, name })),
  me: () => unwrap<AuthUser>(api.get('/auth/me')),
  logout: (refreshToken?: string, allDevices?: boolean) => api.post('/auth/logout', { refreshToken, allDevices }),
};

// ── Catalog ───────────────────────────────────────────────────────────
export const catalogApi = {
  categories: () => unwrap<Category[]>(api.get('/categories')),
  products: (params: { page?: number; categoryId?: string; search?: string; sort?: string }) =>
    unwrapWithMeta<Product[]>(api.get('/products', { params })) as Promise<Page<Product>>,
  product: (id: string) => unwrap<Product>(api.get(`/products/${id}`)),
  config: () => unwrap<StoreConfig>(api.get('/config')),
};

// ── Cart ──────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => unwrap<CartSummary>(api.get('/cart')),
  add: (productId: string, quantity: number) => unwrap<CartSummary>(api.post('/cart', { productId, quantity })),
  update: (productId: string, quantity: number) => unwrap<CartSummary>(api.put('/cart', { productId, quantity })),
  remove: (productId: string) => unwrap<CartSummary>(api.delete('/cart', { params: { productId } })),
  clear: () => unwrap<CartSummary>(api.delete('/cart')),
};

// ── Orders ────────────────────────────────────────────────────────────
export const orderApi = {
  list: (page = 1) => unwrapWithMeta<Order[]>(api.get('/orders', { params: { page } })) as Promise<Page<Order>>,
  get: (id: string) => unwrap<Order>(api.get(`/orders/${id}`)),
  place: (addressId: string, notes?: string) => unwrap<Order>(api.post('/orders', { addressId, notes })),
  cancel: (id: string) => unwrap<Order>(api.post(`/orders/${id}/cancel`)),
  reorder: (orderId: string) => unwrap<{ cart: CartSummary; skipped: string[] }>(api.post('/orders/reorder', { orderId })),
};

// ── Profile & addresses ───────────────────────────────────────────────
export const profileApi = {
  get: () => unwrap<AuthUser>(api.get('/profile')),
  update: (data: { name?: string; email?: string }) => unwrap<AuthUser>(api.put('/profile', data)),
  addresses: () => unwrap<Address[]>(api.get('/addresses')),
  createAddress: (data: Partial<Address>) => unwrap<Address>(api.post('/addresses', data)),
  updateAddress: (id: string, data: Partial<Address>) => unwrap<Address>(api.put(`/addresses/${id}`, data)),
  deleteAddress: (id: string) => api.delete(`/addresses/${id}`),
  setDefaultAddress: (id: string) => unwrap<Address>(api.post(`/addresses/${id}/default`)),
};

// ── Notifications ─────────────────────────────────────────────────────
export const notificationApi = {
  list: (page = 1) => unwrapWithMeta<Notification[]>(api.get('/notifications', { params: { page } })) as Promise<Page<Notification>>,
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// ── Seller ────────────────────────────────────────────────────────────
export const sellerApi = {
  dashboard: () => unwrap<SellerDashboard>(api.get('/seller/dashboard')),
  products: (params: { page?: number; search?: string }) =>
    unwrapWithMeta<Product[]>(api.get('/seller/products', { params })) as Promise<Page<Product>>,
  createProduct: (data: unknown) => unwrap<Product>(api.post('/seller/products', data)),
  updateProduct: (id: string, data: unknown) => unwrap<Product>(api.put(`/seller/products/${id}`, data)),
  deleteProduct: (id: string) => api.delete(`/seller/products/${id}`),
  updateInventory: (id: string, data: { stock?: number; isOutOfStock?: boolean }) =>
    unwrap<Product>(api.patch(`/seller/inventory/${id}`, data)),
  orders: (params: { page?: number; status?: string }) =>
    unwrapWithMeta<Order[]>(api.get('/seller/orders', { params })) as Promise<Page<Order>>,
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    unwrap<Order>(api.patch(`/seller/orders/${id}/status`, { status, reason })),
};

// ── Admin ─────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => unwrap<AdminDashboard>(api.get('/admin/dashboard')),
  users: (params: { page?: number; role?: string; search?: string }) =>
    unwrapWithMeta<ManagedUser[]>(api.get('/admin/users', { params })) as Promise<Page<ManagedUser>>,
  blockUser: (id: string, isBlocked: boolean) => unwrap<ManagedUser>(api.patch(`/admin/users/${id}/block`, { isBlocked })),
  orders: (params: { page?: number; status?: string }) =>
    unwrapWithMeta<Order[]>(api.get('/admin/orders', { params })) as Promise<Page<Order>>,
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    unwrap<Order>(api.patch(`/admin/orders/${id}/status`, { status, reason })),
  categories: () => unwrap<Category[]>(api.get('/admin/categories')),
  createCategory: (data: Partial<Category>) => unwrap<Category>(api.post('/admin/categories', data)),
};

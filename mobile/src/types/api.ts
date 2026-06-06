/** Shared API DTO types — mirror the backend response contracts. */

export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { pagination?: Pagination; unread?: number; [k: string]: unknown };
  error?: { code: string; message: string; details?: unknown };
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  mrp: number;
  discountPercent: number;
  unit: string;
  unitLabel: string;
  isActive: boolean;
  inStock: boolean;
  stock: number;
  primaryImage: string | null;
  images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
}

export interface CartItem {
  productId: string;
  name: string;
  unitLabel: string;
  price: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
  image: string | null;
  inStock: boolean;
  availableStock: number;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  savings: number;
  deliveryFee: number;
  total: number;
  minOrderSubtotal: number;
  meetsMinimum: boolean;
  freeDeliveryAboveSubtotal: number;
}

export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string | null;
  name: string;
  unitLabel: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'COD';
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes: string | null;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  customer?: { id: string; name: string | null; phone: string };
  items: OrderItem[];
  placedAt: string;
  deliveredAt: string | null;
}

export interface StoreConfig {
  storeName: string;
  isOpen: boolean;
  deliveryFee: number;
  freeDeliveryAboveSubtotal: number;
  minOrderSubtotal: number;
  codEnabled: boolean;
  supportPhone: string;
}

export interface SellerDashboard {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  revenue: number;
  lowStockProducts: number;
}

export interface AdminDashboard {
  revenue: number;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  totalCustomers: number;
  totalSellers: number;
  recentOrders: { id: string; orderNumber: string; status: OrderStatus; total: number; placedAt: string }[];
}

export interface ManagedUser {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: Role;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: string;
}

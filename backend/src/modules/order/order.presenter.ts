/** Maps order entities to API DTOs. */
import { moneyToNumber } from '@/core/utils/money';
import type { OrderWithItems } from '@/repositories/order.repository';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface OrderItemDTO {
  productId: string | null;
  name: string;
  unitLabel: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
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
  items: OrderItemDTO[];
  placedAt: string;
  deliveredAt: string | null;
  /** Lifecycle timestamps (null until that stage is reached) for progress UIs. */
  timeline: {
    placedAt: string;
    acceptedAt: string | null;
    packedAt: string | null;
    dispatchedAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  };
}

export function toOrderDTO(o: OrderWithItems): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    subtotal: moneyToNumber(o.subtotal),
    deliveryFee: moneyToNumber(o.deliveryFee),
    discount: moneyToNumber(o.discount),
    total: moneyToNumber(o.total),
    couponCode: o.couponCode,
    notes: o.notes,
    shippingAddress: {
      fullName: o.shipFullName,
      phone: o.shipPhone,
      line1: o.shipLine1,
      line2: o.shipLine2,
      city: o.shipCity,
      state: o.shipState,
      pincode: o.shipPincode,
    },
    customer: o.user ? { id: o.user.id, name: o.user.name, phone: o.user.phone } : undefined,
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.productName,
      unitLabel: i.unitLabel,
      price: moneyToNumber(i.price),
      quantity: i.quantity,
      lineTotal: moneyToNumber(i.lineTotal),
    })),
    placedAt: o.placedAt.toISOString(),
    deliveredAt: o.deliveredAt?.toISOString() ?? null,
    timeline: {
      placedAt: o.placedAt.toISOString(),
      acceptedAt: o.acceptedAt?.toISOString() ?? null,
      packedAt: o.packedAt?.toISOString() ?? null,
      dispatchedAt: o.dispatchedAt?.toISOString() ?? null,
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
    },
  };
}

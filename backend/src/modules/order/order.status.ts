/**
 * Order status state machine. Encodes which transitions are legal and who may
 * perform them, so the rule lives in exactly one place (single source of truth).
 */
import { OrderStatus } from '@prisma/client';

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Maps a target status to the timestamp column that should be stamped. */
export function timestampForStatus(status: OrderStatus): Record<string, Date> {
  const now = new Date();
  switch (status) {
    case OrderStatus.ACCEPTED:
      return { acceptedAt: now };
    case OrderStatus.PACKED:
      return { packedAt: now };
    case OrderStatus.OUT_FOR_DELIVERY:
      return { dispatchedAt: now };
    case OrderStatus.DELIVERED:
      return { deliveredAt: now };
    case OrderStatus.CANCELLED:
    case OrderStatus.REJECTED:
      return { cancelledAt: now };
    default:
      return {};
  }
}

export const CUSTOMER_FACING_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Order placed',
  ACCEPTED: 'Order accepted',
  REJECTED: 'Order rejected',
  PACKED: 'Order packed',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

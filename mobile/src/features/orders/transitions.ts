import type { OrderStatus } from '@/types/api';

export interface OrderAction {
  label: string;
  status: OrderStatus;
  variant: 'primary' | 'secondary' | 'danger';
  icon: 'checkmark-circle-outline' | 'close-circle-outline' | 'cube-outline' | 'bicycle-outline' | 'bag-check-outline';
  /** Capture a reason before confirming (reject / cancel). */
  needsReason?: boolean;
}

/**
 * Legal next actions per status — mirrors the backend order state machine
 * (see backend `order.status.ts`). Single source of truth for the seller UI.
 */
export const ORDER_ACTIONS: Partial<Record<OrderStatus, OrderAction[]>> = {
  PENDING: [
    { label: 'Accept', status: 'ACCEPTED', variant: 'secondary', icon: 'checkmark-circle-outline' },
    { label: 'Reject', status: 'REJECTED', variant: 'danger', icon: 'close-circle-outline', needsReason: true },
  ],
  ACCEPTED: [
    { label: 'Mark packed', status: 'PACKED', variant: 'secondary', icon: 'cube-outline' },
    { label: 'Cancel', status: 'CANCELLED', variant: 'danger', icon: 'close-circle-outline', needsReason: true },
  ],
  PACKED: [
    { label: 'Out for delivery', status: 'OUT_FOR_DELIVERY', variant: 'secondary', icon: 'bicycle-outline' },
    { label: 'Cancel', status: 'CANCELLED', variant: 'danger', icon: 'close-circle-outline', needsReason: true },
  ],
  OUT_FOR_DELIVERY: [
    { label: 'Mark delivered', status: 'DELIVERED', variant: 'secondary', icon: 'bag-check-outline' },
  ],
};

export function nextActions(status: OrderStatus): OrderAction[] {
  return ORDER_ACTIONS[status] ?? [];
}

/** True when the order is in a terminal state (no further transitions). */
export function isTerminal(status: OrderStatus): boolean {
  return nextActions(status).length === 0;
}

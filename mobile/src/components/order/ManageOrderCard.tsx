import { Alert, Text, View } from 'react-native';
import { Button, Card, StatusBadge } from '@/components/ui';
import { formatCurrency } from '@/theme/colors';
import type { Order, OrderStatus } from '@/types/api';

/** Next legal actions per status — mirrors the backend state machine. */
const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; status: OrderStatus; variant?: 'danger' | 'secondary' }[]>> = {
  PENDING: [
    { label: 'Accept', status: 'ACCEPTED', variant: 'secondary' },
    { label: 'Reject', status: 'REJECTED', variant: 'danger' },
  ],
  ACCEPTED: [{ label: 'Mark packed', status: 'PACKED', variant: 'secondary' }],
  PACKED: [{ label: 'Out for delivery', status: 'OUT_FOR_DELIVERY', variant: 'secondary' }],
  OUT_FOR_DELIVERY: [{ label: 'Mark delivered', status: 'DELIVERED', variant: 'secondary' }],
};

export function ManageOrderCard({
  order,
  onUpdateStatus,
  busy,
}: {
  order: Order;
  onUpdateStatus: (status: OrderStatus) => void;
  busy?: boolean;
}) {
  const actions = NEXT_ACTIONS[order.status] ?? [];

  const confirm = (label: string, status: OrderStatus) =>
    Alert.alert(`${label}?`, `Order ${order.orderNumber}`, [
      { text: 'Cancel' },
      { text: label, onPress: () => onUpdateStatus(status) },
    ]);

  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-ink">{order.orderNumber}</Text>
        <StatusBadge status={order.status} />
      </View>
      <Text className="mt-1 text-xs text-ink-muted">
        {new Date(order.placedAt).toLocaleString()} · {order.items.length} item(s)
      </Text>
      {order.customer ? (
        <Text className="mt-0.5 text-xs text-ink-muted">👤 {order.customer.name ?? 'Customer'} · {order.customer.phone}</Text>
      ) : null}
      <Text className="mt-0.5 text-xs text-ink-muted">📍 {order.shippingAddress.city}, {order.shippingAddress.pincode}</Text>

      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-ink">{formatCurrency(order.total)} · COD</Text>
      </View>

      {actions.length > 0 ? (
        <View className="mt-3 flex-row gap-2">
          {actions.map((a) => (
            <View key={a.status} className="flex-1">
              <Button label={a.label} size="sm" variant={a.variant ?? 'primary'} loading={busy} onPress={() => confirm(a.label, a.status)} />
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

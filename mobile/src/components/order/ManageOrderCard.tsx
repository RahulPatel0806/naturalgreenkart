import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Button, Card, StatusBadge, Icon, ReasonModal } from '@/components/ui';
import { colors, formatCurrency } from '@/theme/colors';
import { nextActions, type OrderAction } from '@/features/orders/transitions';
import type { Order, OrderStatus } from '@/types/api';

export function ManageOrderCard({
  order,
  onUpdateStatus,
  onPress,
  busy,
}: {
  order: Order;
  onUpdateStatus: (status: OrderStatus, reason?: string) => void;
  onPress?: () => void;
  busy?: boolean;
}) {
  const actions = nextActions(order.status);
  const [reasonAction, setReasonAction] = useState<OrderAction | null>(null);

  const trigger = (action: OrderAction) => {
    if (action.needsReason) {
      setReasonAction(action);
      return;
    }
    Alert.alert(`${action.label}?`, `Order ${order.orderNumber}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.label, onPress: () => onUpdateStatus(action.status) },
    ]);
  };

  const call = () => {
    const phone = order.customer?.phone ?? order.shippingAddress.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <Card className="mb-2">
      <Pressable onPress={onPress} disabled={!onPress}>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-ink">{order.orderNumber}</Text>
          <View className="flex-row items-center gap-1">
            <StatusBadge status={order.status} />
            {onPress ? <Icon name="chevron-forward" size={16} color={colors.inkSoft} /> : null}
          </View>
        </View>
        <Text className="mt-1 text-xs text-ink-muted">
          {new Date(order.placedAt).toLocaleString()} · {order.items.length} item(s)
        </Text>
        {order.customer ? (
          <View className="mt-1 flex-row items-center">
            <Icon name="person-outline" size={13} color={colors.inkMuted} />
            <Text className="ml-1 text-xs text-ink-muted">{order.customer.name ?? 'Customer'} · {order.customer.phone}</Text>
          </View>
        ) : null}
        <View className="mt-0.5 flex-row items-center">
          <Icon name="location-outline" size={13} color={colors.inkMuted} />
          <Text className="ml-1 text-xs text-ink-muted">{order.shippingAddress.city}, {order.shippingAddress.pincode}</Text>
        </View>

        <Text className="mt-2 text-sm font-semibold text-ink">{formatCurrency(order.total)} · COD</Text>
      </Pressable>

      <View className="mt-3 flex-row gap-2">
        <Pressable onPress={call} className="flex-row items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-2 active:bg-surface-muted">
          <Icon name="call-outline" size={15} color={colors.primary} />
          <Text className="text-xs font-semibold text-primary">Call</Text>
        </Pressable>
        {actions.map((a) => (
          <View key={a.status} className="flex-1">
            <Button label={a.label} size="sm" variant={a.variant} loading={busy} onPress={() => trigger(a)} />
          </View>
        ))}
      </View>

      <ReasonModal
        visible={!!reasonAction}
        title={`${reasonAction?.label ?? ''} order?`}
        message={`Order ${order.orderNumber}. The customer will be notified.`}
        placeholder="Reason (optional)"
        confirmLabel={reasonAction?.label ?? 'Confirm'}
        confirmVariant="danger"
        loading={busy}
        onConfirm={(reason) => {
          if (reasonAction) onUpdateStatus(reasonAction.status, reason || undefined);
          setReasonAction(null);
        }}
        onClose={() => setReasonAction(null)}
      />
    </Card>
  );
}

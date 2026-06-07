import { useState } from 'react';
import { Alert, Linking, Platform, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Screen, Button, Card, StatusBadge, Icon, LoadingState, ErrorState, ReasonModal } from '@/components/ui';
import { sellerApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { colors, formatCurrency } from '@/theme/colors';
import { nextActions, type OrderAction } from '@/features/orders/transitions';
import type { SellerStackParamList } from '@/navigation/types';
import type { Order } from '@/types/api';

type Rt = RouteProp<SellerStackParamList, 'SellerOrderDetails'>;

const TIMELINE_STEPS: { key: keyof Order['timeline']; label: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'placedAt', label: 'Order placed', icon: 'receipt-outline' },
  { key: 'acceptedAt', label: 'Accepted', icon: 'checkmark-circle-outline' },
  { key: 'packedAt', label: 'Packed', icon: 'cube-outline' },
  { key: 'dispatchedAt', label: 'Out for delivery', icon: 'bicycle-outline' },
  { key: 'deliveredAt', label: 'Delivered', icon: 'bag-check-outline' },
];

export function SellerOrderDetailsScreen() {
  const { params } = useRoute<Rt>();
  const qc = useQueryClient();
  const [reasonAction, setReasonAction] = useState<OrderAction | null>(null);

  const { data: order, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['seller', 'order', params.id],
    queryFn: () => sellerApi.order(params.id),
  });

  const update = useMutation({
    mutationFn: ({ next, reason }: { next: Order['status']; reason?: string }) => sellerApi.updateOrderStatus(params.id, next, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'order', params.id] });
      qc.invalidateQueries({ queryKey: ['seller', 'orders'] });
    },
    onError: (e) => Alert.alert('Update failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !order) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;

  const phone = order.customer?.phone ?? order.shippingAddress.phone;
  const cancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const actions = nextActions(order.status);

  const call = () => phone && Linking.openURL(`tel:${phone}`);
  const openMaps = () => {
    const q = encodeURIComponent(`${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`);
    Linking.openURL(Platform.select({ ios: `http://maps.apple.com/?q=${q}`, default: `https://www.google.com/maps/search/?api=1&query=${q}` })!);
  };

  const trigger = (action: OrderAction) => {
    if (action.needsReason) { setReasonAction(action); return; }
    Alert.alert(`${action.label}?`, `Order ${order.orderNumber}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.label, onPress: () => update.mutate({ next: action.status }) },
    ]);
  };

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      {/* Header */}
      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink">{order.orderNumber}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text className="mt-1 text-xs text-ink-muted">Placed {new Date(order.placedAt).toLocaleString()}</Text>
      </Card>

      {/* Timeline */}
      <Card className="mt-3">
        <Text className="mb-3 text-base font-bold text-ink">Status</Text>
        {cancelled ? (
          <View className="flex-row items-center">
            <Icon name="close-circle" size={22} color={colors.danger} />
            <Text className="ml-2 text-sm font-semibold text-danger">
              {order.status === 'REJECTED' ? 'Order rejected' : 'Order cancelled'}
              {order.timeline.cancelledAt ? ` · ${new Date(order.timeline.cancelledAt).toLocaleString()}` : ''}
            </Text>
          </View>
        ) : (
          TIMELINE_STEPS.map((step, idx) => {
            const ts = order.timeline[step.key];
            const done = !!ts;
            const isLast = idx === TIMELINE_STEPS.length - 1;
            return (
              <View key={step.key} className="flex-row">
                <View className="items-center">
                  <View className={`h-8 w-8 items-center justify-center rounded-full ${done ? 'bg-primary' : 'bg-surface-muted border border-surface-border'}`}>
                    <Icon name={step.icon} size={16} color={done ? '#fff' : colors.inkSoft} />
                  </View>
                  {!isLast ? <View className={`my-0.5 w-0.5 flex-1 ${done ? 'bg-primary' : 'bg-surface-border'}`} style={{ minHeight: 18 }} /> : null}
                </View>
                <View className="ml-3 pb-3">
                  <Text className={`text-sm font-semibold ${done ? 'text-ink' : 'text-ink-soft'}`}>{step.label}</Text>
                  {ts ? <Text className="text-xs text-ink-muted">{new Date(ts).toLocaleString()}</Text> : null}
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Customer */}
      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Customer</Text>
        <Text className="text-sm text-ink">{order.customer?.name ?? order.shippingAddress.fullName}</Text>
        <Text className="text-xs text-ink-muted">{phone}</Text>
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1"><Button label="Call" size="sm" variant="outline" icon={<Icon name="call-outline" size={16} color={colors.primary} />} onPress={call} /></View>
          <View className="flex-1"><Button label="Directions" size="sm" variant="outline" icon={<Icon name="navigate-outline" size={16} color={colors.primary} />} onPress={openMaps} /></View>
        </View>
      </Card>

      {/* Delivery address */}
      <Card className="mt-3">
        <Text className="mb-1 text-base font-bold text-ink">Delivery address</Text>
        <Text className="text-sm text-ink">{order.shippingAddress.fullName}</Text>
        <Text className="text-sm text-ink-muted">
          {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
        </Text>
      </Card>

      {/* Items */}
      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Items ({order.items.length})</Text>
        {order.items.map((item, idx) => (
          <View key={idx} className="flex-row justify-between py-1">
            <Text className="flex-1 text-sm text-ink">
              {item.name} <Text className="text-ink-muted">· {item.unitLabel} × {item.quantity}</Text>
            </Text>
            <Text className="text-sm font-medium text-ink">{formatCurrency(item.lineTotal)}</Text>
          </View>
        ))}
        <View className="my-2 h-px bg-surface-border" />
        <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
        <Row label="Delivery fee" value={order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)} />
        {order.discount > 0 ? <Row label="Discount" value={`- ${formatCurrency(order.discount)}`} /> : null}
        <Row label="Total · COD" value={formatCurrency(order.total)} bold />
      </Card>

      {order.notes ? (
        <Card className="mt-3">
          <Text className="mb-1 text-base font-bold text-ink">Customer notes</Text>
          <Text className="text-sm text-ink-muted">{order.notes}</Text>
        </Card>
      ) : null}

      {/* Actions */}
      {actions.length > 0 ? (
        <View className="mt-4 gap-2">
          {actions.map((a) => (
            <Button
              key={a.status}
              label={a.label}
              variant={a.variant}
              loading={update.isPending}
              icon={<Icon name={a.icon} size={18} color={a.variant === 'danger' ? '#fff' : a.variant === 'secondary' ? colors.primaryDark : '#fff'} />}
              onPress={() => trigger(a)}
            />
          ))}
        </View>
      ) : null}

      <ReasonModal
        visible={!!reasonAction}
        title={`${reasonAction?.label ?? ''} order?`}
        message={`Order ${order.orderNumber}. The customer will be notified and stock will be restored.`}
        placeholder="Reason (optional)"
        confirmLabel={reasonAction?.label ?? 'Confirm'}
        confirmVariant="danger"
        loading={update.isPending}
        onConfirm={(reason) => {
          if (reasonAction) update.mutate({ next: reasonAction.status, reason: reason || undefined });
          setReasonAction(null);
        }}
        onClose={() => setReasonAction(null)}
      />
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'text-ink-muted'}`}>{label}</Text>
      <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

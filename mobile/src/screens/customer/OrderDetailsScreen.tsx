import { Alert, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Card, StatusBadge, LoadingState, ErrorState } from '@/components/ui';
import { orderApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/store/query';
import { formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';

type Rt = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const CANCELLABLE = ['PENDING', 'ACCEPTED'];

export function OrderDetailsScreen() {
  const { params } = useRoute<Rt>();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.order(params.id),
    queryFn: () => orderApi.get(params.id),
  });

  const cancel = useMutation({
    mutationFn: () => orderApi.cancel(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.order(params.id) });
      qc.invalidateQueries({ queryKey: queryKeys.orders });
    },
    onError: (e) => Alert.alert('Could not cancel', e instanceof ApiError ? e.message : 'Try again later.'),
  });

  const reorder = useMutation({
    mutationFn: () => orderApi.reorder(params.id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      const msg = res.skipped.length ? `Some items were unavailable: ${res.skipped.join(', ')}` : 'Items added to your cart.';
      Alert.alert('Reordered', msg, [{ text: 'Go to cart', onPress: () => navigation.navigate('Tabs', { screen: 'Cart' }) }, { text: 'OK' }]);
    },
  });

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !order) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;

  return (
    <Screen>
      <Card className="mt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-ink">{order.orderNumber}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text className="mt-1 text-xs text-ink-muted">Placed {new Date(order.placedAt).toLocaleString()}</Text>
      </Card>

      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Items</Text>
        {order.items.map((item, idx) => (
          <View key={idx} className="flex-row justify-between py-1">
            <Text className="flex-1 text-sm text-ink">{item.name} <Text className="text-ink-muted">× {item.quantity}</Text></Text>
            <Text className="text-sm font-medium text-ink">{formatCurrency(item.lineTotal)}</Text>
          </View>
        ))}
        <View className="my-2 h-px bg-surface-border" />
        <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
        <Row label="Delivery fee" value={order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)} />
        {order.discount > 0 ? (
          <Row label={order.couponCode ? `Coupon (${order.couponCode})` : 'Discount'} value={`- ${formatCurrency(order.discount)}`} />
        ) : null}
        <Row label="Total" value={formatCurrency(order.total)} bold />
      </Card>

      <Card className="mt-3">
        <Text className="mb-1 text-base font-bold text-ink">Delivery address</Text>
        <Text className="text-sm text-ink">{order.shippingAddress.fullName}</Text>
        <Text className="text-sm text-ink-muted">
          {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
        </Text>
        <Text className="mt-0.5 text-xs text-ink-muted">+91 {order.shippingAddress.phone}</Text>
      </Card>

      <View className="mt-4 gap-2">
        <Button label="Reorder these items" variant="outline" loading={reorder.isPending} onPress={() => reorder.mutate()} />
        {CANCELLABLE.includes(order.status) ? (
          <Button
            label="Cancel order"
            variant="danger"
            loading={cancel.isPending}
            onPress={() => Alert.alert('Cancel order?', 'This cannot be undone.', [{ text: 'No' }, { text: 'Yes, cancel', style: 'destructive', onPress: () => cancel.mutate() }])}
          />
        ) : null}
      </View>
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

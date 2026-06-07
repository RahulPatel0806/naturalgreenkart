import { Image, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, LoadingState, ErrorState, EmptyState, Card, QuantityStepper } from '@/components/ui';
import { useCart, useCartMutations } from '@/features/cart/useCart';
import { formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList, CustomerTabParamList } from '@/navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CartItem } from '@/types/api';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, 'Cart'>,
  NativeStackNavigationProp<CustomerStackParamList>
>;
const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

function Row({ item }: { item: CartItem }) {
  const { update, remove } = useCartMutations();
  return (
    <Card className="mb-2 flex-row items-center">
      <Image source={{ uri: item.image ?? PLACEHOLDER }} className="h-14 w-14 rounded-lg bg-surface-muted" resizeMode="contain" />
      <View className="ml-3 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-ink">{item.name}</Text>
        <Text className="text-xs text-ink-muted">{item.unitLabel}</Text>
        <Text className="mt-0.5 text-sm font-bold text-ink">{formatCurrency(item.lineTotal)}</Text>
        {!item.inStock ? <Text className="text-xs text-danger">Out of stock</Text> : null}
      </View>
      <QuantityStepper
        value={item.quantity}
        max={item.availableStock}
        onChange={(n) => (n === 0 ? remove.mutate(item.productId) : update.mutate({ productId: item.productId, quantity: n }))}
      />
    </Card>
  );
}

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const { data: cart, isLoading, isError, refetch, isRefetching } = useCart();

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !cart) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;
  if (cart.items.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState icon="cart-outline" title="Your cart is empty" message="Add fresh groceries to get started." action={{ label: 'Browse products', onPress: () => navigation.navigate('Home') }} />
      </Screen>
    );
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Text className="py-3 text-lg font-bold text-ink">Your cart ({cart.itemCount})</Text>

      {cart.items.map((item) => (
        <Row key={item.productId} item={item} />
      ))}

      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Bill details</Text>
        <SummaryRow label="Item total" value={formatCurrency(cart.subtotal)} />
        {cart.savings > 0 ? <SummaryRow label="Savings" value={`- ${formatCurrency(cart.savings)}`} highlight /> : null}
        <SummaryRow label="Delivery fee" value={cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)} />
        <View className="my-2 h-px bg-surface-border" />
        <SummaryRow label="To pay" value={formatCurrency(cart.total)} bold />
        {!cart.meetsMinimum ? (
          <Text className="mt-2 text-xs text-warning">Minimum order value is {formatCurrency(cart.minOrderSubtotal)}.</Text>
        ) : null}
      </Card>

      <View className="mt-4">
        <Button label={`Proceed to checkout · ${formatCurrency(cart.total)}`} disabled={!cart.meetsMinimum} onPress={() => navigation.navigate('Checkout')} />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'text-ink-muted'}`}>{label}</Text>
      <Text className={`text-sm ${bold ? 'font-bold text-ink' : highlight ? 'font-semibold text-primary' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Card, Icon, LoadingState, ErrorState } from '@/components/ui';
import { profileApi, orderApi, offersApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { useCart } from '@/features/cart/useCart';
import { queryKeys } from '@/store/query';
import { colors, formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';
import type { Address, CouponPreview } from '@/types/api';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { data: cart } = useCart();
  const addressesQ = useQuery({ queryKey: queryKeys.addresses, queryFn: profileApi.addresses });
  const [selected, setSelected] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [applied, setApplied] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string>();
  const [applying, setApplying] = useState(false);

  const addresses = addressesQ.data ?? [];
  const selectedId = selected ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (code.length < 3) return setCouponError('Enter a valid coupon code');
    setApplying(true);
    setCouponError(undefined);
    try {
      const preview = await offersApi.applyCoupon(code);
      setApplied(preview);
      setCouponInput(preview.code);
    } catch (e) {
      setApplied(null);
      setCouponError(e instanceof ApiError ? e.message : 'Could not apply this coupon');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCouponInput('');
    setCouponError(undefined);
  };

  const placeOrder = async () => {
    if (!selectedId) return Alert.alert('Add an address', 'Please add a delivery address to continue.');
    setPlacing(true);
    try {
      const order = await orderApi.place(selectedId, { couponCode: applied?.code });
      await qc.invalidateQueries({ queryKey: queryKeys.cart });
      await qc.invalidateQueries({ queryKey: queryKeys.orders });
      navigation.replace('OrderDetails', { id: order.id });
    } catch (e) {
      Alert.alert('Order failed', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (addressesQ.isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (addressesQ.isError) return <Screen scroll={false}><ErrorState onRetry={() => addressesQ.refetch()} /></Screen>;

  return (
    <Screen>
      <Text className="py-3 text-lg font-bold text-ink">Delivery address</Text>

      {addresses.length === 0 ? (
        <Card>
          <Text className="text-sm text-ink-muted">No saved addresses yet.</Text>
          <View className="mt-3">
            <Button label="Add address" variant="outline" onPress={() => navigation.navigate('Addresses')} />
          </View>
        </Card>
      ) : (
        addresses.map((a: Address) => {
          const active = a.id === selectedId;
          return (
            <Pressable key={a.id} onPress={() => setSelected(a.id)}>
              <Card className={`mb-2 border ${active ? 'border-primary' : 'border-transparent'}`}>
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-ink">{a.type} · {a.fullName}</Text>
                  {a.isDefault ? <Text className="text-xs text-primary">Default</Text> : null}
                </View>
                <Text className="mt-1 text-sm text-ink-muted">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-muted">+91 {a.phone}</Text>
              </Card>
            </Pressable>
          );
        })
      )}

      <Pressable onPress={() => navigation.navigate('Addresses')}>
        <Text className="mb-4 mt-1 text-sm font-semibold text-primary">+ Add new address</Text>
      </Pressable>

      <Card>
        <Text className="mb-2 text-base font-bold text-ink">Payment method</Text>
        <View className="flex-row items-center rounded-xl border border-primary bg-primary-light px-3 py-3">
          <Icon name="cash-outline" size={20} color={colors.primaryDark} />
          <Text className="ml-2 font-semibold text-primary-dark">Cash on Delivery</Text>
        </View>
      </Card>

      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Apply coupon</Text>
        {applied ? (
          <View className="flex-row items-center justify-between rounded-xl border border-primary bg-primary-light px-3 py-2.5">
            <View className="flex-1 flex-row items-center gap-2">
              <Icon name="pricetag" size={18} color={colors.primaryDark} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-primary-dark">{applied.code} applied</Text>
                <Text className="text-xs text-primary-dark">You saved {formatCurrency(applied.discount)}</Text>
              </View>
            </View>
            <Pressable onPress={removeCoupon} hitSlop={8}>
              <Text className="text-xs font-semibold text-danger">Remove</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center rounded-xl border border-surface-border bg-white px-3">
              <Icon name="pricetag-outline" size={18} color={colors.inkSoft} />
              <TextInput
                placeholder="Enter coupon code"
                placeholderTextColor={colors.inkSoft}
                autoCapitalize="characters"
                autoCorrect={false}
                value={couponInput}
                onChangeText={(t) => { setCouponInput(t); setCouponError(undefined); }}
                className="ml-2 flex-1 py-2.5 text-sm font-semibold tracking-wider text-ink"
              />
            </View>
            <Button label="Apply" variant="secondary" fullWidth={false} loading={applying} onPress={applyCoupon} />
          </View>
        )}
        {couponError ? <Text className="mt-1.5 text-xs text-danger">{couponError}</Text> : null}
      </Card>

      {cart ? (
        <Card className="mt-3 gap-1.5">
          <Row label="Item total" value={formatCurrency(cart.subtotal)} />
          <Row label="Delivery fee" value={cart.deliveryFee === 0 ? 'FREE' : formatCurrency(cart.deliveryFee)} />
          {applied && applied.discount > 0 ? (
            <Row label={`Coupon (${applied.code})`} value={`- ${formatCurrency(applied.discount)}`} highlight />
          ) : null}
          <View className="mt-1 flex-row justify-between border-t border-surface-border pt-2">
            <Text className="text-base font-bold text-ink">Total payable</Text>
            <Text className="text-base font-bold text-ink">{formatCurrency(applied ? applied.total : cart.total)}</Text>
          </View>
        </Card>
      ) : null}

      <View className="mt-4">
        <Button label="Place order (COD)" loading={placing} disabled={!selectedId} onPress={placeOrder} />
      </View>
    </Screen>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between">
      <Text className={`text-sm ${highlight ? 'text-primary-dark' : 'text-ink-muted'}`}>{label}</Text>
      <Text className={`text-sm font-semibold ${highlight ? 'text-primary-dark' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

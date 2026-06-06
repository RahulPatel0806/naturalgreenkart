import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Button, Card, LoadingState, ErrorState } from '@/components/ui';
import { profileApi, orderApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { useCart } from '@/features/cart/useCart';
import { queryKeys } from '@/store/query';
import { formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';
import type { Address } from '@/types/api';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function CheckoutScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { data: cart } = useCart();
  const addressesQ = useQuery({ queryKey: queryKeys.addresses, queryFn: profileApi.addresses });
  const [selected, setSelected] = useState<string>();
  const [placing, setPlacing] = useState(false);

  const addresses = addressesQ.data ?? [];
  const selectedId = selected ?? addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id;

  const placeOrder = async () => {
    if (!selectedId) return Alert.alert('Add an address', 'Please add a delivery address to continue.');
    setPlacing(true);
    try {
      const order = await orderApi.place(selectedId);
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
                <Text className="mt-0.5 text-xs text-ink-muted">📞 {a.phone}</Text>
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
          <Text className="text-lg">💵</Text>
          <Text className="ml-2 font-semibold text-primary-dark">Cash on Delivery</Text>
        </View>
      </Card>

      {cart ? (
        <Card className="mt-3">
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-ink">Total payable</Text>
            <Text className="text-base font-bold text-ink">{formatCurrency(cart.total)}</Text>
          </View>
        </Card>
      ) : null}

      <View className="mt-4">
        <Button label="Place order (COD)" loading={placing} disabled={!selectedId} onPress={placeOrder} />
      </View>
    </Screen>
  );
}

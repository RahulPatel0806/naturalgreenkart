import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { ManageOrderCard } from '@/components/order/ManageOrderCard';
import { sellerApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { Alert } from 'react-native';
import type { OrderStatus } from '@/types/api';

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'On the way', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
];

export function SellerOrdersScreen() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['seller', 'orders', status],
    queryFn: () => sellerApi.orders({ status }),
  });

  const update = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => sellerApi.updateOrderStatus(id, next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller', 'orders'] }),
    onError: (e) => Alert.alert('Update failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="py-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          data={FILTERS}
          keyExtractor={(f) => f.label}
          renderItem={({ item }) => {
            const active = item.value === status;
            return (
              <Pressable onPress={() => setStatus(item.value)} className={`mr-2 rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState icon="🧾" title="No orders here" />}
          renderItem={({ item }) => (
            <ManageOrderCard order={item} busy={update.isPending} onUpdateStatus={(next) => update.mutate({ id: item.id, next })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

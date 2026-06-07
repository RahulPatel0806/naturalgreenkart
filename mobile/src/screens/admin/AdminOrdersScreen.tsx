import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { ManageOrderCard } from '@/components/order/ManageOrderCard';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import type { OrderStatus } from '@/types/api';

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function AdminOrdersScreen() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => adminApi.orders({ status }),
  });

  const update = useMutation({
    mutationFn: ({ id, next, reason }: { id: string; next: OrderStatus; reason?: string }) => adminApi.updateOrderStatus(id, next, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
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
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders" />}
          renderItem={({ item }) => (
            <ManageOrderCard order={item} busy={update.isPending} onUpdateStatus={(next, reason) => update.mutate({ id: item.id, next, reason })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

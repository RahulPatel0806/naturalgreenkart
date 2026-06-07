import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { ManageOrderCard } from '@/components/order/ManageOrderCard';
import { sellerApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { colors } from '@/theme/colors';
import type { SellerStackParamList } from '@/navigation/types';
import type { OrderStatus } from '@/types/api';

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'On the way', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Rejected', value: 'REJECTED' },
];

type Nav = NativeStackNavigationProp<SellerStackParamList>;

export function SellerOrdersScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useInfiniteQuery({
    queryKey: ['seller', 'orders', status, search],
    queryFn: ({ pageParam }) => sellerApi.orders({ status, search: search || undefined, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage.meta?.pagination;
      return p && p.page < p.totalPages ? p.page + 1 : undefined;
    },
  });

  const orders = query.data?.pages.flatMap((pg) => pg.data) ?? [];

  const update = useMutation({
    mutationFn: ({ id, next, reason }: { id: string; next: OrderStatus; reason?: string }) => sellerApi.updateOrderStatus(id, next, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller', 'orders'] }),
    onError: (e) => Alert.alert('Update failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="px-4 pt-3">
        <Input placeholder="Search by order # or phone…" value={searchInput} onChangeText={setSearchInput} autoCapitalize="characters" />
      </View>

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

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage(); }}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders here" message="Orders matching this filter will appear here." />}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.primary} className="py-4" /> : null}
          renderItem={({ item }) => (
            <ManageOrderCard
              order={item}
              busy={update.isPending}
              onPress={() => navigation.navigate('SellerOrderDetails', { id: item.id })}
              onUpdateStatus={(next, reason) => update.mutate({ id: item.id, next, reason })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

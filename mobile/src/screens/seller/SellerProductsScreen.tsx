import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Card, LoadingState, ErrorState, EmptyState, Button } from '@/components/ui';
import { sellerApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { formatCurrency } from '@/theme/colors';
import type { Product } from '@/types/api';

const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

export function SellerProductsScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['seller', 'products', search],
    queryFn: () => sellerApi.products({ search: search || undefined }),
  });

  const toggleStock = useMutation({
    mutationFn: ({ id, isOutOfStock }: { id: string; isOutOfStock: boolean }) => sellerApi.updateInventory(id, { isOutOfStock }),
    onMutate: ({ id }) => setPendingId(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller', 'products'] }),
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Update failed'),
    onSettled: () => setPendingId(null),
  });

  const adjustStock = (product: Product) => {
    Alert.prompt?.(
      'Update stock',
      `Set available stock for ${product.name}`,
      (text) => {
        const n = Number(text);
        if (!Number.isNaN(n) && n >= 0) {
          sellerApi.updateInventory(product.id, { stock: n }).then(() => qc.invalidateQueries({ queryKey: ['seller', 'products'] }));
        }
      },
      'plain-text',
      String(product.stock),
      'number-pad',
    );
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="px-4 py-3">
        <Input placeholder="Search your products…" value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState icon="📦" title="No products" message="Create your first product." />}
          renderItem={({ item }) => (
            <Card className="mb-2 flex-row items-center">
              <Image source={{ uri: item.primaryImage ?? PLACEHOLDER }} className="h-14 w-14 rounded-lg bg-surface-muted" resizeMode="contain" />
              <View className="ml-3 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-ink">{item.name}</Text>
                <Text className="text-xs text-ink-muted">{item.unitLabel} · {formatCurrency(item.price)}</Text>
                <Text className={`text-xs font-semibold ${item.inStock ? 'text-success' : 'text-danger'}`}>
                  {item.inStock ? `In stock: ${item.stock}` : 'Out of stock'}
                </Text>
              </View>
              <View className="gap-1">
                <Button label="Stock" size="sm" variant="outline" fullWidth={false} onPress={() => adjustStock(item)} />
                <Button
                  label={item.inStock ? 'Mark out' : 'Restock'}
                  size="sm"
                  variant={item.inStock ? 'danger' : 'secondary'}
                  fullWidth={false}
                  loading={pendingId === item.id}
                  onPress={() => toggleStock.mutate({ id: item.id, isOutOfStock: item.inStock })}
                />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

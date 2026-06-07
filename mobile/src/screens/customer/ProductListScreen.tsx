import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { catalogApi } from '@/api/endpoints';
import type { CustomerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;
type Rt = RouteProp<CustomerStackParamList, 'ProductList'>;

export function ProductListScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const [search, setSearch] = useState(params?.search ?? '');

  const query = useInfiniteQuery({
    queryKey: ['products', 'list', params?.categoryId, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => catalogApi.products({ page: pageParam, categoryId: params?.categoryId, search: search || undefined }),
    getNextPageParam: (last) => {
      const p = last.meta?.pagination;
      return p && p.page < p.totalPages ? p.page + 1 : undefined;
    },
  });

  const products = query.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="px-4 py-3">
        <Input placeholder="Search products…" value={search} onChangeText={setSearch} returnKeyType="search" />
      </View>

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : products.length === 0 ? (
        <EmptyState icon="search-outline" title="No products found" message="Try a different search or category." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 10 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && query.fetchNextPage()}
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
        />
      )}
    </SafeAreaView>
  );
}

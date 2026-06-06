import { useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Input, LoadingState, ErrorState, Skeleton } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { catalogApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import type { CustomerStackParamList } from '@/navigation/types';
import type { Category } from '@/types/api';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function CategoryPill({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-3 w-20 items-center">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} className="h-10 w-10" resizeMode="contain" />
        ) : (
          <Text className="text-2xl">🥬</Text>
        )}
      </View>
      <Text numberOfLines={2} className="mt-1 text-center text-[11px] font-medium text-ink">
        {category.name}
      </Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const categoriesQ = useQuery({ queryKey: queryKeys.categories, queryFn: catalogApi.categories });
  const productsQ = useQuery({
    queryKey: queryKeys.products({ page: 1 }),
    queryFn: () => catalogApi.products({ page: 1 }),
  });

  const refreshing = categoriesQ.isRefetching || productsQ.isRefetching;
  const onRefresh = () => {
    void categoriesQ.refetch();
    void productsQ.refetch();
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="pb-2 pt-2">
        <Text className="text-xs text-ink-muted">Delivering to</Text>
        <Text className="text-base font-bold text-ink">Home · Fast delivery 🛵</Text>
      </View>

      <Pressable onPress={() => navigation.navigate('ProductList', { search: search || undefined })}>
        <View pointerEvents="box-only">
          <Input
            placeholder="Search for vegetables, fruits, milk…"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => navigation.navigate('ProductList', { search: search || undefined })}
          />
        </View>
      </Pressable>

      <View className="mt-5">
        <Text className="mb-3 text-base font-bold text-ink">Shop by category</Text>
        {categoriesQ.isLoading ? (
          <View className="flex-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mr-3 h-16 w-16" />
            ))}
          </View>
        ) : categoriesQ.isError ? (
          <ErrorState onRetry={() => categoriesQ.refetch()} />
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categoriesQ.data}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <CategoryPill category={item} onPress={() => navigation.navigate('ProductList', { categoryId: item.id, categoryName: item.name })} />
            )}
          />
        )}
      </View>

      <View className="mt-6">
        <Text className="mb-1 text-base font-bold text-ink">Fresh picks for you</Text>
        {productsQ.isLoading ? (
          <LoadingState label="Loading products…" />
        ) : productsQ.isError ? (
          <ErrorState onRetry={() => productsQ.refetch()} />
        ) : (
          <View className="flex-row flex-wrap">
            {productsQ.data?.data.map((p) => (
              <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('ProductDetails', { id: p.id })} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

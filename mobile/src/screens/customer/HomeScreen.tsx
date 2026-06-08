import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input, LoadingState, ErrorState, EmptyState, Skeleton, Icon } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { BannerCarousel } from '@/components/offers/BannerCarousel';
import { catalogApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { useAuthStore } from '@/store/auth.store';
import { useUnreadCount } from '@/features/notifications/useNotifications';
import { resolveImageUrl } from '@/lib/imageUrl';
import { colors } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';
import type { Category, OfferBanner } from '@/types/api';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

function CategoryPill({ category, onPress }: { category: Category; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-3 w-20 items-center">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
        {category.imageUrl ? (
          <Image source={{ uri: resolveImageUrl(category.imageUrl) }} className="h-10 w-10" resizeMode="contain" />
        ) : (
          <Icon name="leaf-outline" size={26} color={colors.primaryDark} />
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
  const unread = useUnreadCount();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onAccount = () =>
    Alert.alert(
      user?.name ?? 'Account',
      user?.phone ? `+91 ${user.phone}` : 'Manage your session',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void logout() },
      ],
    );

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

  const products = productsQ.data?.data ?? [];

  // A banner with a coupon nudges the customer to the cart to apply it; otherwise just browse.
  const onPressBanner = (b: OfferBanner) => {
    if (b.couponCode) navigation.navigate('Tabs', { screen: 'Cart' });
    else navigation.navigate('ProductList', {});
  };

  const header = (
    <View>
      <View className="px-4">
      <View className="flex-row items-center justify-between pb-2 pt-2">
        <View className="flex-1">
          <Text className="text-xs text-ink-muted">Delivering to</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="location" size={15} color={colors.primary} />
            <Text className="text-base font-bold text-ink">Home · Fast delivery</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => navigation.navigate('Notifications')} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Icon name="notifications-outline" size={22} color={colors.ink} />
            {unread > 0 ? (
              <View className="absolute right-1 top-1 min-w-[16px] items-center justify-center rounded-full bg-accent px-1">
                <Text className="text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable onPress={onAccount} hitSlop={8} accessibilityRole="button" accessibilityLabel="Account and log out" className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70">
            <Icon name="person-circle-outline" size={24} color={colors.ink} />
          </Pressable>
        </View>
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
      </View>

      <BannerCarousel onPressBanner={onPressBanner} />

      <View className="px-4">
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

      <View className="mb-3 mt-6 flex-row items-center justify-between">
        <Text className="text-base font-bold text-ink">Fresh picks for you</Text>
        {products.length > 0 ? (
          <Pressable onPress={() => navigation.navigate('ProductList', {})} hitSlop={8}>
            <Text className="text-sm font-semibold text-primary">See all</Text>
          </Pressable>
        ) : null}
      </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-muted">
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ paddingHorizontal: 10 }}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { id: item.id })} />
        )}
        ListEmptyComponent={
          productsQ.isLoading ? (
            <LoadingState label="Loading products…" />
          ) : productsQ.isError ? (
            <ErrorState onRetry={() => productsQ.refetch()} />
          ) : (
            <EmptyState icon="leaf-outline" title="No products yet" message="Check back soon for fresh picks." />
          )
        }
      />
    </SafeAreaView>
  );
}

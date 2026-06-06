import { Image, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Screen, Button, LoadingState, ErrorState, QuantityStepper } from '@/components/ui';
import { catalogApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { useCartMutations, useCartQuantity } from '@/features/cart/useCart';
import { formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';

type Rt = RouteProp<CustomerStackParamList, 'ProductDetails'>;
const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

export function ProductDetailsScreen() {
  const { params } = useRoute<Rt>();
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.product(params.id),
    queryFn: () => catalogApi.product(params.id),
  });
  const qty = useCartQuantity(params.id);
  const { add, update } = useCartMutations();

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !product) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;

  return (
    <Screen>
      <View className="items-center rounded-2xl bg-white py-6">
        <Image source={{ uri: product.primaryImage ?? PLACEHOLDER }} className="h-52 w-52" resizeMode="contain" />
      </View>

      <View className="mt-4">
        <Text className="text-xs text-ink-muted">{product.unitLabel}</Text>
        <Text className="mt-1 text-xl font-bold text-ink">{product.name}</Text>
        <Text className="mt-0.5 text-sm text-ink-muted">{product.categoryName}</Text>

        <View className="mt-3 flex-row items-center gap-2">
          <Text className="text-2xl font-extrabold text-ink">{formatCurrency(product.price)}</Text>
          {product.mrp > product.price ? (
            <>
              <Text className="text-base text-ink-soft line-through">{formatCurrency(product.mrp)}</Text>
              <View className="rounded bg-primary-light px-2 py-0.5">
                <Text className="text-xs font-bold text-primary-dark">{product.discountPercent}% OFF</Text>
              </View>
            </>
          ) : null}
        </View>

        {product.description ? (
          <View className="mt-5">
            <Text className="mb-1 text-base font-semibold text-ink">About this product</Text>
            <Text className="text-sm leading-5 text-ink-muted">{product.description}</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-8">
        {!product.inStock ? (
          <Button label="Out of stock" disabled />
        ) : qty > 0 ? (
          <View className="flex-row items-center justify-between rounded-xl border border-primary px-4 py-2">
            <Text className="font-semibold text-ink">In cart</Text>
            <QuantityStepper value={qty} max={product.stock} onChange={(n) => update.mutate({ productId: product.id, quantity: n })} />
          </View>
        ) : (
          <Button label="Add to cart" loading={add.isPending} onPress={() => add.mutate({ productId: product.id, quantity: 1 })} />
        )}
      </View>
    </Screen>
  );
}

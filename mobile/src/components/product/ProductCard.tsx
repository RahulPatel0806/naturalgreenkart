import { Image, Pressable, Text, View } from 'react-native';
import { Button, QuantityStepper } from '@/components/ui';
import { useCartMutations, useCartQuantity } from '@/features/cart/useCart';
import { formatCurrency } from '@/theme/colors';
import type { Product } from '@/types/api';

const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const qty = useCartQuantity(product.id);
  const { add, update } = useCartMutations();
  const busy = add.isPending || update.isPending;

  const changeQty = (next: number) => {
    if (next === 0) update.mutate({ productId: product.id, quantity: 0 });
    else update.mutate({ productId: product.id, quantity: next });
  };

  return (
    <View className="m-1.5 flex-1 rounded-2xl bg-white p-3" style={{ maxWidth: '47%' }}>
      <Pressable onPress={onPress}>
        <View className="relative">
          <Image
            source={{ uri: product.primaryImage ?? PLACEHOLDER }}
            className="h-28 w-full rounded-xl bg-surface-muted"
            resizeMode="contain"
          />
          {product.discountPercent > 0 ? (
            <View className="absolute left-0 top-0 rounded-br-xl rounded-tl-xl bg-accent px-1.5 py-0.5">
              <Text className="text-[10px] font-bold text-white">{product.discountPercent}% OFF</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-2 text-xs text-ink-muted">{product.unitLabel}</Text>
        <Text numberOfLines={2} className="mt-0.5 min-h-[34px] text-sm font-semibold text-ink">
          {product.name}
        </Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          <Text className="text-sm font-bold text-ink">{formatCurrency(product.price)}</Text>
          {product.mrp > product.price ? (
            <Text className="text-xs text-ink-soft line-through">{formatCurrency(product.mrp)}</Text>
          ) : null}
        </View>
      </Pressable>

      <View className="mt-2">
        {!product.inStock ? (
          <View className="h-9 items-center justify-center rounded-lg bg-surface-muted">
            <Text className="text-xs font-semibold text-danger">Out of stock</Text>
          </View>
        ) : qty > 0 ? (
          <View className="items-end">
            <QuantityStepper value={qty} max={product.stock} onChange={changeQty} disabled={busy} />
          </View>
        ) : (
          <Button label="ADD" size="sm" variant="secondary" loading={busy} onPress={() => add.mutate({ productId: product.id, quantity: 1 })} />
        )}
      </View>
    </View>
  );
}

import { Text, View } from 'react-native';
import { TabBarIcon } from '@/navigation/TabBarIcon';
import { useCart } from '@/features/cart/useCart';

/** Cart tab icon with a live item-count badge. */
export function CartBadge({ focused }: { focused: boolean }) {
  const { data } = useCart();
  const count = data?.itemCount ?? 0;
  return (
    <View>
      <TabBarIcon emoji="🛒" focused={focused} />
      {count > 0 ? (
        <View className="absolute -right-2 -top-1 min-w-[18px] items-center justify-center rounded-full bg-accent px-1">
          <Text className="text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

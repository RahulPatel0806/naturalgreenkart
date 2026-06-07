import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingState, ErrorState, EmptyState, Card, StatusBadge } from '@/components/ui';
import { orderApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { formatCurrency } from '@/theme/colors';
import type { CustomerStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

export function OrdersScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => orderApi.list(1),
  });

  if (isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => refetch()} /></SafeAreaView>;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface-muted">
      <Text className="px-4 py-3 text-lg font-bold text-ink">My orders</Text>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" message="Your placed orders will appear here." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('OrderDetails', { id: item.id })}>
            <Card className="mb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-ink">{item.orderNumber}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text className="mt-1 text-xs text-ink-muted">
                {new Date(item.placedAt).toLocaleString()} · {item.items.length} item(s)
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-ink">{formatCurrency(item.total)}</Text>
                <Text className="text-xs font-semibold text-primary">View details ›</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

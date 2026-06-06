import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Card, StatusBadge, LoadingState, ErrorState } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { formatCurrency } from '@/theme/colors';

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="m-1 flex-1">
      <Text className="text-2xl font-extrabold" style={{ color: accent ?? '#0F172A' }}>{value}</Text>
      <Text className="mt-1 text-xs text-ink-muted">{label}</Text>
    </Card>
  );
}

export function AdminDashboardScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: adminApi.dashboard,
  });

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !data) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Text className="py-3 text-lg font-bold text-ink">Platform overview</Text>

      <View className="flex-row">
        <Metric label="Revenue" value={formatCurrency(data.revenue)} accent="#16A34A" />
        <Metric label="Total orders" value={String(data.totalOrders)} />
      </View>
      <View className="flex-row">
        <Metric label="Customers" value={String(data.totalCustomers)} accent="#2563EB" />
        <Metric label="Sellers" value={String(data.totalSellers)} accent="#7C3AED" />
      </View>

      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Orders by status</Text>
        {Object.entries(data.ordersByStatus).map(([s, count]) => (
          <View key={s} className="flex-row items-center justify-between py-1">
            <StatusBadge status={s} />
            <Text className="text-sm font-semibold text-ink">{count}</Text>
          </View>
        ))}
      </Card>

      <Card className="mt-3">
        <Text className="mb-2 text-base font-bold text-ink">Recent orders</Text>
        {data.recentOrders.map((o) => (
          <View key={o.id} className="flex-row items-center justify-between border-b border-surface-border py-2">
            <View>
              <Text className="text-sm font-semibold text-ink">{o.orderNumber}</Text>
              <Text className="text-xs text-ink-muted">{new Date(o.placedAt).toLocaleDateString()}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold text-ink">{formatCurrency(o.total)}</Text>
              <StatusBadge status={o.status} />
            </View>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

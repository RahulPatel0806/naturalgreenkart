import { Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, Card, LoadingState, ErrorState } from '@/components/ui';
import { sellerApi } from '@/api/endpoints';
import { queryKeys } from '@/store/query';
import { formatCurrency } from '@/theme/colors';
import { useAuthStore } from '@/store/auth.store';

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <Card className="m-1 flex-1">
      <Text className="text-2xl font-extrabold" style={{ color: accent ?? '#0F172A' }}>{value}</Text>
      <Text className="mt-1 text-xs text-ink-muted">{label}</Text>
    </Card>
  );
}

export function SellerDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: queryKeys.sellerDashboard,
    queryFn: sellerApi.dashboard,
  });

  if (isLoading) return <Screen scroll={false}><LoadingState /></Screen>;
  if (isError || !data) return <Screen scroll={false}><ErrorState onRetry={() => refetch()} /></Screen>;

  return (
    <Screen refreshing={isRefetching} onRefresh={refetch}>
      <Text className="py-3 text-base text-ink-muted">Welcome back, <Text className="font-bold text-ink">{user?.name ?? 'Seller'}</Text></Text>

      <View className="flex-row">
        <Metric label="Total orders" value={String(data.totalOrders)} />
        <Metric label="Pending" value={String(data.pendingOrders)} accent="#D97706" />
      </View>
      <View className="flex-row">
        <Metric label="Delivered" value={String(data.deliveredOrders)} accent="#16A34A" />
        <Metric label="Revenue" value={formatCurrency(data.revenue)} accent="#16A34A" />
      </View>
      <View className="flex-row">
        <Metric label="Low / out of stock" value={String(data.lowStockProducts)} accent="#DC2626" />
        <View className="m-1 flex-1" />
      </View>
    </Screen>
  );
}

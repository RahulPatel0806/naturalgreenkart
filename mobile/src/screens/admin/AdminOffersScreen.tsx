import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState, EmptyState, Icon } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/store/query';
import { resolveImageUrl } from '@/lib/imageUrl';
import { colors, formatCurrency } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';
import type { Coupon, OfferBanner } from '@/types/api';

const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';
type Nav = NativeStackNavigationProp<AdminStackParamList>;
type Tab = 'coupons' | 'banners';

function discountLabel(c: Coupon): string {
  const base = c.discountType === 'PERCENT' ? `${c.discountValue}% off` : `${formatCurrency(c.discountValue)} off`;
  const cap = c.discountType === 'PERCENT' && c.maxDiscount ? ` up to ${formatCurrency(c.maxDiscount)}` : '';
  return base + cap;
}

export function AdminOffersScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('coupons');

  const couponsQ = useQuery({ queryKey: queryKeys.adminCoupons, queryFn: adminApi.coupons });
  const bannersQ = useQuery({ queryKey: queryKeys.adminBanners, queryFn: adminApi.banners });

  const removeCoupon = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminCoupons }),
    onError: (e) => Alert.alert('Delete failed', e instanceof ApiError ? e.message : 'Try again.'),
  });
  const removeBanner = useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminBanners }),
    onError: (e) => Alert.alert('Delete failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  const confirmDelete = (label: string, onConfirm: () => void) =>
    Alert.alert('Delete', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);

  const active = tab === 'coupons' ? couponsQ : bannersQ;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="flex-row gap-2 px-4 pb-1 pt-3">
        {(['coupons', 'banners'] as Tab[]).map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} onPress={() => setTab(t)} className={`flex-1 items-center rounded-xl py-2.5 ${on ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
              <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-ink-muted'}`}>{t === 'coupons' ? 'Coupons' : 'Banners'}</Text>
            </Pressable>
          );
        })}
      </View>

      {active.isLoading ? (
        <LoadingState />
      ) : active.isError ? (
        <ErrorState onRetry={() => active.refetch()} />
      ) : tab === 'coupons' ? (
        <FlatList
          data={couponsQ.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          refreshing={couponsQ.isRefetching}
          onRefresh={couponsQ.refetch}
          ListEmptyComponent={<EmptyState icon="pricetag-outline" title="No coupons yet" message="Tap + to create a discount code." />}
          renderItem={({ item }: { item: Coupon }) => (
            <Card className="mb-2">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-extrabold tracking-wider text-primary-dark">{item.code}</Text>
                    {!item.isActive ? <Text className="text-xs font-semibold text-warning">· Inactive</Text> : null}
                  </View>
                  <Text className="mt-0.5 text-sm font-semibold text-ink">{discountLabel(item)}</Text>
                  <Text className="mt-0.5 text-xs text-ink-muted">
                    Min order {formatCurrency(item.minOrderSubtotal)}
                    {item.usageLimit ? ` · used ${item.usedCount}/${item.usageLimit}` : ` · used ${item.usedCount}`}
                    {item.perUserLimit ? ` · ${item.perUserLimit}/user` : ''}
                  </Text>
                  {item.expiresAt ? <Text className="mt-0.5 text-xs text-ink-soft">Expires {new Date(item.expiresAt).toLocaleDateString()}</Text> : null}
                </View>
                <View className="flex-row gap-2">
                  <IconBtn icon="create-outline" onPress={() => navigation.navigate('AdminCouponForm', { id: item.id })} />
                  <IconBtn icon="trash-outline" tone="danger" onPress={() => confirmDelete(item.code, () => removeCoupon.mutate(item.id))} />
                </View>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={bannersQ.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          refreshing={bannersQ.isRefetching}
          onRefresh={bannersQ.refetch}
          ListEmptyComponent={<EmptyState icon="image-outline" title="No banners yet" message="Tap + to add a home-screen banner." />}
          renderItem={({ item }: { item: OfferBanner }) => (
            <Card className="mb-2">
              <Image source={{ uri: resolveImageUrl(item.imageUrl) || PLACEHOLDER }} className="h-28 w-full rounded-xl bg-surface-muted" resizeMode="cover" />
              <View className="mt-2 flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text numberOfLines={1} className="text-sm font-semibold text-ink">{item.title}</Text>
                  {item.subtitle ? <Text numberOfLines={1} className="text-xs text-ink-muted">{item.subtitle}</Text> : null}
                  <Text className="mt-0.5 text-xs text-ink-soft">
                    order {item.sortOrder}
                    {item.couponCode ? ` · code ${item.couponCode}` : ''}
                    {!item.isActive ? ' · Inactive' : ''}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <IconBtn icon="create-outline" onPress={() => navigation.navigate('AdminBannerForm', { id: item.id })} />
                  <IconBtn icon="trash-outline" tone="danger" onPress={() => confirmDelete(item.title, () => removeBanner.mutate(item.id))} />
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate(tab === 'coupons' ? 'AdminCouponForm' : 'AdminBannerForm')}
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
      >
        <Icon name="add" size={30} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

function IconBtn({ icon, onPress, tone = 'default' }: { icon: React.ComponentProps<typeof Icon>['name']; onPress: () => void; tone?: 'default' | 'danger' }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="h-9 w-9 items-center justify-center rounded-lg bg-surface-muted active:opacity-70">
      <Icon name={icon} size={18} color={tone === 'danger' ? colors.danger : colors.ink} />
    </Pressable>
  );
}

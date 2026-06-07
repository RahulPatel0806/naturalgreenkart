import { useState } from 'react';
import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Card, LoadingState, ErrorState, EmptyState, Icon } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { formatCurrency, colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';
import type { Category, Product } from '@/types/api';

const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export function AdminProductsScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const { data: categories } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminApi.categories });
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'products', categoryId, search],
    queryFn: () => adminApi.products({ categoryId, search: search || undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
    onError: (e) => Alert.alert('Delete failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateProduct(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
    onError: (e) => Alert.alert('Update failed', e instanceof ApiError ? e.message : 'Try again.'),
  });

  const confirmDelete = (p: Product) =>
    Alert.alert('Delete product', `Remove "${p.name}" from the store?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(p.id) },
    ]);

  const filters: { label: string; value?: string }[] = [
    { label: 'All' },
    ...(categories ?? []).map((c: Category) => ({ label: c.name, value: c.id })),
  ];

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="px-4 pt-3">
        <Input placeholder="Search products…" value={search} onChangeText={setSearch} />
      </View>

      <View className="py-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          data={filters}
          keyExtractor={(f) => f.value ?? 'all'}
          renderItem={({ item }) => {
            const active = item.value === categoryId;
            return (
              <Pressable onPress={() => setCategoryId(item.value)} className={`mr-2 rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState icon="cube-outline" title="No products" message="Tap + to add your first product." />}
          renderItem={({ item }) => (
            <Card className="mb-2">
              <View className="flex-row items-center">
                <Image source={{ uri: item.primaryImage ?? PLACEHOLDER }} className="h-16 w-16 rounded-lg bg-surface-muted" resizeMode="cover" />
                <View className="ml-3 flex-1">
                  <Text numberOfLines={1} className="text-sm font-semibold text-ink">{item.name}</Text>
                  <Text className="text-xs text-ink-muted">{item.categoryName} · {item.unitLabel}</Text>
                  <Text className="mt-0.5 text-sm font-bold text-ink">{formatCurrency(item.price)} <Text className="text-xs font-normal text-ink-soft line-through">{item.mrp > item.price ? formatCurrency(item.mrp) : ''}</Text></Text>
                  <View className="mt-0.5 flex-row items-center gap-2">
                    <Text className={`text-xs font-semibold ${item.inStock ? 'text-success' : 'text-danger'}`}>
                      {item.inStock ? `In stock: ${item.stock}` : 'Out of stock'}
                    </Text>
                    {!item.isActive ? <Text className="text-xs font-semibold text-warning">· Hidden</Text> : null}
                  </View>
                </View>
              </View>

              <View className="mt-3 flex-row gap-2 border-t border-surface-border pt-3">
                <ActionButton icon="create-outline" label="Edit" onPress={() => navigation.navigate('AdminProductForm', { id: item.id })} />
                <ActionButton
                  icon={item.isActive ? 'eye-off-outline' : 'eye-outline'}
                  label={item.isActive ? 'Hide' : 'Show'}
                  onPress={() => toggleActive.mutate({ id: item.id, isActive: !item.isActive })}
                />
                <ActionButton icon="trash-outline" label="Delete" tone="danger" onPress={() => confirmDelete(item)} />
              </View>
            </Card>
          )}
        />
      )}

      {/* Floating actions: manage categories + add product */}
      <View className="absolute bottom-5 right-5 items-end gap-3">
        <Pressable
          onPress={() => navigation.navigate('AdminCategories')}
          className="h-12 flex-row items-center gap-1.5 rounded-full bg-white px-4 shadow-lg border border-surface-border active:opacity-80"
        >
          <Icon name="pricetags-outline" size={18} color={colors.ink} />
          <Text className="text-sm font-semibold text-ink">Categories</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('AdminProductForm')}
          className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
        >
          <Icon name="add" size={30} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ActionButton({ icon, label, onPress, tone = 'default' }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; onPress: () => void; tone?: 'default' | 'danger' }) {
  const color = tone === 'danger' ? colors.danger : colors.ink;
  return (
    <Pressable onPress={onPress} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-surface-muted py-2 active:opacity-70">
      <Icon name={icon} size={16} color={color} />
      <Text className="text-xs font-semibold" style={{ color }}>{label}</Text>
    </Pressable>
  );
}

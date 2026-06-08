import { Alert, FlatList, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, LoadingState, ErrorState, EmptyState, Icon } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import { resolveImageUrl } from '@/lib/imageUrl';
import { colors } from '@/theme/colors';
import type { AdminStackParamList } from '@/navigation/types';
import type { Category } from '@/types/api';

const PLACEHOLDER = 'https://images.aggrimart.app/placeholder.png';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export function AdminCategoriesScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminApi.categories,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
    onError: (e) => Alert.alert('Delete failed', e instanceof ApiError ? e.message : 'A category with products cannot be deleted.'),
  });

  const confirmDelete = (c: Category) =>
    Alert.alert('Delete category', `Remove "${c.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(c.id) },
    ]);

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No categories" message="Tap + to create one." />}
          renderItem={({ item }) => (
            <Card className="mb-2 flex-row items-center">
              <Image source={{ uri: resolveImageUrl(item.imageUrl) ?? PLACEHOLDER }} className="h-12 w-12 rounded-lg bg-surface-muted" resizeMode="cover" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-ink">{item.name}</Text>
                <Text className="text-xs text-ink-muted">{item.isActive ? 'Active' : 'Hidden'} · order {item.sortOrder}</Text>
              </View>
              <Pressable onPress={() => navigation.navigate('AdminCategoryForm', { id: item.id })} hitSlop={8} className="mr-1 h-9 w-9 items-center justify-center rounded-lg bg-surface-muted active:opacity-70">
                <Icon name="create-outline" size={18} color={colors.ink} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-lg bg-surface-muted active:opacity-70">
                <Icon name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Card>
          )}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate('AdminCategoryForm')}
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
      >
        <Icon name="add" size={30} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

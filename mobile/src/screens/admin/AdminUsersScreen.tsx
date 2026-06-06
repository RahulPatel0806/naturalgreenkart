import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input, Card, Button, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { adminApi } from '@/api/endpoints';
import { ApiError } from '@/api/client';
import type { Role } from '@/types/api';

const ROLE_FILTERS: { label: string; value?: Role }[] = [
  { label: 'All' },
  { label: 'Customers', value: 'CUSTOMER' },
  { label: 'Sellers', value: 'SELLER' },
];

export function AdminUsersScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | undefined>();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'users', role, search],
    queryFn: () => adminApi.users({ role, search: search || undefined }),
  });

  const block = useMutation({
    mutationFn: ({ id, isBlocked }: { id: string; isBlocked: boolean }) => adminApi.blockUser(id, isBlocked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
    onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Action failed'),
  });

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      <View className="px-4 py-3">
        <Input placeholder="Search by name or phone…" value={search} onChangeText={setSearch} />
        <View className="mt-2 flex-row gap-2">
          {ROLE_FILTERS.map((f) => {
            const active = f.value === role;
            return (
              <Pressable key={f.label} onPress={() => setRole(f.value)} className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-white border border-surface-border'}`}>
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState icon="👥" title="No users found" />}
          renderItem={({ item }) => (
            <Card className="mb-2 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink">{item.name ?? 'Unnamed'} <Text className="text-xs text-ink-muted">· {item.role}</Text></Text>
                <Text className="text-xs text-ink-muted">+91 {item.phone}</Text>
                {item.isBlocked ? <Text className="text-xs font-semibold text-danger">Blocked</Text> : null}
              </View>
              <Button
                label={item.isBlocked ? 'Unblock' : 'Block'}
                size="sm"
                variant={item.isBlocked ? 'secondary' : 'danger'}
                fullWidth={false}
                loading={block.isPending}
                onPress={() => block.mutate({ id: item.id, isBlocked: !item.isBlocked })}
              />
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

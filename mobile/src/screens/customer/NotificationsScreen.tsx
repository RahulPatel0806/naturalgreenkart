import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoadingState, ErrorState, EmptyState, Card, Icon, type IconName } from '@/components/ui';
import { colors } from '@/theme/colors';
import { useNotificationsQuery, useNotificationMutations, orderIdFromNotification } from '@/features/notifications/useNotifications';
import type { CustomerStackParamList } from '@/navigation/types';
import type { Notification } from '@/types/api';

type Nav = NativeStackNavigationProp<CustomerStackParamList>;

const ICON_FOR_TYPE: Record<string, IconName> = {
  ORDER_STATUS: 'receipt-outline',
  PROMOTION: 'pricetag-outline',
  SYSTEM: 'information-circle-outline',
};

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const query = useNotificationsQuery();
  const { markRead, markAllRead } = useNotificationMutations();

  const notifications = query.data?.data ?? [];
  const unread = query.data?.meta?.unread ?? 0;

  const onPress = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    const orderId = orderIdFromNotification(n.data);
    if (orderId) navigation.navigate('OrderDetails', { id: orderId });
  };

  if (query.isLoading) return <SafeAreaView className="flex-1 bg-surface-muted"><LoadingState /></SafeAreaView>;
  if (query.isError) return <SafeAreaView className="flex-1 bg-surface-muted"><ErrorState onRetry={() => query.refetch()} /></SafeAreaView>;

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface-muted">
      {unread > 0 ? (
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-xs text-ink-muted">{unread} unread</Text>
          <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
            <Text className="text-xs font-semibold text-primary">Mark all as read</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 }}
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications" message="Order updates and offers will show up here." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPress(item)}>
            <Card className={`mb-2 flex-row ${item.isRead ? '' : 'border border-primary/30 bg-primary-light/30'}`}>
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-primary-light">
                <Icon name={ICON_FOR_TYPE[item.type] ?? 'notifications-outline'} size={18} color={colors.primaryDark} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="flex-1 text-sm font-semibold text-ink">{item.title}</Text>
                  {!item.isRead ? <View className="ml-2 h-2 w-2 rounded-full bg-primary" /> : null}
                </View>
                <Text className="mt-0.5 text-xs text-ink-muted">{item.body}</Text>
                <Text className="mt-1 text-[11px] text-ink-soft">{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

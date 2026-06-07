import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/endpoints';

const KEY = ['notifications', 'list'] as const;

/** Shared notifications query (page 1). Drives both the list and the unread badge. */
export function useNotificationsQuery() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => notificationApi.list(1),
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

/** Unread count for the header badge. */
export function useUnreadCount(): number {
  const { data } = useNotificationsQuery();
  return data?.meta?.unread ?? 0;
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });
  const markRead = useMutation({ mutationFn: (id: string) => notificationApi.markRead(id), onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: () => notificationApi.markAllRead(), onSuccess: invalidate });
  return { markRead, markAllRead };
}

/** Pull an orderId out of a notification's `data` payload, if present. */
export function orderIdFromNotification(data: unknown): string | null {
  if (data && typeof data === 'object' && 'orderId' in data) {
    const id = (data as { orderId?: unknown }).orderId;
    return typeof id === 'string' ? id : null;
  }
  return null;
}

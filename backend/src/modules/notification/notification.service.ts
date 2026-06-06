/** Notification creation + read management. Order events fan out to here. */
import { notificationRepository } from '@/repositories/notification.repository';
import type { PageParams } from '@/repositories/pagination';
import type { NotificationType, Notification } from '@prisma/client';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: unknown;
  isRead: boolean;
  createdAt: string;
}

function toDTO(n: Notification): NotificationDTO {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export const notificationService = {
  async list(userId: string, params: PageParams) {
    const result = await notificationRepository.listForUser(userId, params);
    const unread = await notificationRepository.unreadCount(userId);
    return { ...result, items: result.items.map(toDTO), unread };
  },

  markRead(userId: string, id: string) {
    return notificationRepository.markRead(userId, id);
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },
};

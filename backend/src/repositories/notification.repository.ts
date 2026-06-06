/** Data access for notifications. */
import { prisma, type Prisma } from '@/core/db/prisma';
import { toSkipTake, type PageParams, type Paginated } from './pagination';
import type { Notification } from '@prisma/client';

export const notificationRepository = {
  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  },

  createInTx(tx: Prisma.TransactionClient, data: Prisma.NotificationUncheckedCreateInput) {
    return tx.notification.create({ data });
  },

  async listForUser(userId: string, params: PageParams): Promise<Paginated<Notification>> {
    const where: Prisma.NotificationWhereInput = { userId };
    const [items, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(params) }),
      prisma.notification.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  markRead(userId: string, id: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },
};

/** Data access for orders. */
import { prisma, type Prisma } from '@/core/db/prisma';
import { toSkipTake, type PageParams, type Paginated } from './pagination';
import type { OrderStatus } from '@prisma/client';

const orderInclude = {
  items: true,
  user: { select: { id: true, name: true, phone: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const orderRepository = {
  findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  },

  /**
   * Creates an order + its items inside the caller's transaction client so it
   * composes with stock decrement & cart clear atomically.
   */
  createInTx(
    tx: Prisma.TransactionClient,
    data: Prisma.OrderCreateInput,
  ) {
    return tx.order.create({ data, include: orderInclude });
  },

  async listForUser(userId: string, params: PageParams): Promise<Paginated<OrderWithItems>> {
    const where: Prisma.OrderWhereInput = { userId };
    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { placedAt: 'desc' }, ...toSkipTake(params) }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  async listAll(params: PageParams & { status?: OrderStatus; search?: string }): Promise<Paginated<OrderWithItems>> {
    const where: Prisma.OrderWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? { OR: [{ orderNumber: { contains: params.search, mode: 'insensitive' } }, { shipPhone: { contains: params.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.order.findMany({ where, include: orderInclude, orderBy: { placedAt: 'desc' }, ...toSkipTake(params) }),
      prisma.order.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  updateStatus(id: string, status: OrderStatus, timestamps: Partial<Record<string, Date>>) {
    return prisma.order.update({ where: { id }, data: { status, ...timestamps }, include: orderInclude });
  },
};

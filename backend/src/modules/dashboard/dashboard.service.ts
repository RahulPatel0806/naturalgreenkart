/** Aggregated metrics for seller and admin dashboards. */
import { prisma } from '@/core/db/prisma';
import { moneyToNumber } from '@/core/utils/money';
import { OrderStatus, RoleName } from '@prisma/client';

const REVENUE_STATUSES = [OrderStatus.DELIVERED];

export const dashboardService = {
  async sellerDashboard() {
    const [total, pending, delivered, revenueAgg, lowStock] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.aggregate({ where: { status: { in: REVENUE_STATUSES } }, _sum: { total: true } }),
      prisma.inventory.count({ where: { OR: [{ isOutOfStock: true }, { stock: { lte: 5 } }] } }),
    ]);

    return {
      totalOrders: total,
      pendingOrders: pending,
      deliveredOrders: delivered,
      revenue: moneyToNumber(revenueAgg._sum.total ?? 0),
      lowStockProducts: lowStock,
    };
  },

  async adminDashboard() {
    const [revenueAgg, orders, ordersByStatus, customers, sellers, recentOrders] = await Promise.all([
      prisma.order.aggregate({ where: { status: { in: REVENUE_STATUSES } }, _sum: { total: true } }),
      prisma.order.count(),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { role: { name: RoleName.CUSTOMER } } }),
      prisma.user.count({ where: { role: { name: RoleName.SELLER } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { placedAt: 'desc' },
        select: { id: true, orderNumber: true, status: true, total: true, placedAt: true },
      }),
    ]);

    return {
      revenue: moneyToNumber(revenueAgg._sum.total ?? 0),
      totalOrders: orders,
      ordersByStatus: Object.fromEntries(ordersByStatus.map((g) => [g.status, g._count._all])),
      totalCustomers: customers,
      totalSellers: sellers,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: moneyToNumber(o.total),
        placedAt: o.placedAt.toISOString(),
      })),
    };
  },
};

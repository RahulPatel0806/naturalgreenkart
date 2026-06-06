/** Data access for the customer cart. */
import { prisma, type Prisma } from '@/core/db/prisma';

const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, inventory: true },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export const cartRepository = {
  /** Returns the user's cart, creating an empty one on first access. */
  async getOrCreate(userId: string): Promise<CartWithItems> {
    const existing = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId }, include: cartInclude });
  },

  async upsertItem(userId: string, productId: string, quantity: number): Promise<CartWithItems> {
    const cart = await this.getOrCreate(userId);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity },
      create: { cartId: cart.id, productId, quantity },
    });
    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  },

  async removeItem(userId: string, productId: string): Promise<CartWithItems> {
    const cart = await this.getOrCreate(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  },

  async clear(userId: string): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  },
};

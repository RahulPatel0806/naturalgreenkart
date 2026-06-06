/** Data access for customer addresses. */
import { prisma, type Prisma } from '@/core/db/prisma';

export const addressRepository = {
  listForUser(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  findById(id: string) {
    return prisma.address.findUnique({ where: { id } });
  },

  /** Creating/updating a default address clears the previous default atomically. */
  async create(userId: string, data: Omit<Prisma.AddressCreateInput, 'user'>) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      }
      const count = await tx.address.count({ where: { userId } });
      return tx.address.create({
        data: { ...data, isDefault: data.isDefault || count === 0, user: { connect: { id: userId } } },
      });
    });
  },

  async update(userId: string, id: string, data: Prisma.AddressUpdateInput) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.address.updateMany({ where: { userId, isDefault: true, NOT: { id } }, data: { isDefault: false } });
      }
      return tx.address.update({ where: { id }, data });
    });
  },

  delete(id: string) {
    return prisma.address.delete({ where: { id } });
  },

  async setDefault(userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
  },
};

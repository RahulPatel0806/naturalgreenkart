/** Data access for categories, products and product images. */
import { prisma, type Prisma } from '@/core/db/prisma';
import { toSkipTake, type PageParams, type Paginated } from './pagination';

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' } },
  inventory: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export const categoryRepository = {
  list(opts?: { activeOnly?: boolean }) {
    return prisma.category.findMany({
      where: opts?.activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};

export const productRepository = {
  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  },

  async list(
    params: PageParams & {
      categoryId?: string;
      search?: string;
      activeOnly?: boolean;
      sellerId?: string;
      sort?: 'newest' | 'price_asc' | 'price_desc';
    },
  ): Promise<Paginated<ProductWithRelations>> {
    const where: Prisma.ProductWhereInput = {
      ...(params.activeOnly ? { isActive: true } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.sellerId ? { sellerId: params.sellerId } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search } },
              { description: { contains: params.search } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      params.sort === 'price_asc'
        ? { price: 'asc' }
        : params.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, include: productInclude, orderBy, ...toSkipTake(params) }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  },

  /** Create product, its inventory row and images in one transaction. */
  create(data: {
    base: Omit<Prisma.ProductCreateInput, 'category' | 'seller' | 'images' | 'inventory'>;
    categoryId: string;
    sellerId: string;
    stock: number;
    images: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[];
  }) {
    return prisma.product.create({
      data: {
        ...data.base,
        category: { connect: { id: data.categoryId } },
        seller: { connect: { id: data.sellerId } },
        inventory: { create: { stock: data.stock, isOutOfStock: data.stock <= 0 } },
        images: { create: data.images },
      },
      include: productInclude,
    });
  },

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  },

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },

  replaceImages(productId: string, images: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[]) {
    return prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      if (images.length) {
        await tx.productImage.createMany({ data: images.map((i) => ({ ...i, productId })) });
      }
      return tx.product.findUnique({ where: { id: productId }, include: productInclude });
    });
  },
};

export const inventoryRepository = {
  upsert(productId: string, data: { stock?: number; isOutOfStock?: boolean; lowStockThreshold?: number }) {
    return prisma.inventory.upsert({
      where: { productId },
      update: data,
      create: { productId, stock: data.stock ?? 0, isOutOfStock: data.isOutOfStock ?? false },
    });
  },
};

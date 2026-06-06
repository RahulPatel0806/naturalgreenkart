/** Catalog read/write business logic (customer browse + seller/admin management). */
import { categoryRepository, productRepository, inventoryRepository } from '@/repositories/catalog.repository';
import { blobStorage } from '@/core/storage/blob';
import { NotFoundError } from '@/core/errors/app-error';
import { slugify } from '@/core/utils/ids';
import { toProductDTO, toCategoryDTO, type ProductDTO } from './catalog.presenter';
import type { PageParams } from '@/repositories/pagination';
import type { CreateProductInput, UpdateProductInput, CreateCategoryInput } from '@/validation/catalog.schema';

async function uniqueSlug(name: string, lookup: (slug: string) => Promise<boolean>): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 1;
  while (await lookup(slug)) slug = `${base}-${n++}`;
  return slug;
}

export const catalogService = {
  // ── Categories ───────────────────────────────────────────────────────
  async listCategories(activeOnly: boolean) {
    const categories = await categoryRepository.list({ activeOnly });
    return categories.map(toCategoryDTO);
  },

  async createCategory(input: CreateCategoryInput) {
    const slug = await uniqueSlug(input.name, async (s) => {
      const { prisma } = await import('@/core/db/prisma');
      return !!(await prisma.category.findUnique({ where: { slug: s } }));
    });
    const created = await categoryRepository.create({ ...input, slug });
    return toCategoryDTO(created);
  },

  async updateCategory(id: string, input: Partial<CreateCategoryInput>) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category');
    const updated = await categoryRepository.update(id, input);
    return toCategoryDTO(updated);
  },

  async deleteCategory(id: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new NotFoundError('Category');
    await categoryRepository.delete(id);
  },

  // ── Products ─────────────────────────────────────────────────────────
  async listProducts(
    params: PageParams & { categoryId?: string; search?: string; sort?: 'newest' | 'price_asc' | 'price_desc'; sellerId?: string; activeOnly?: boolean },
  ): Promise<{ items: ProductDTO[]; total: number; page: number; pageSize: number }> {
    const result = await productRepository.list(params);
    return { ...result, items: result.items.map(toProductDTO) };
  },

  async getProduct(id: string): Promise<ProductDTO> {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('Product');
    return toProductDTO(product);
  },

  async createProduct(sellerId: string, input: CreateProductInput): Promise<ProductDTO> {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) throw new NotFoundError('Category');

    const slug = await uniqueSlug(input.name, async (s) => {
      const { prisma } = await import('@/core/db/prisma');
      return !!(await prisma.product.findUnique({ where: { slug: s } }));
    });

    const images = input.images.length
      ? input.images.map((img, idx) => ({ ...img, isPrimary: img.isPrimary ?? idx === 0, sortOrder: img.sortOrder ?? idx }))
      : [];

    const product = await productRepository.create({
      base: {
        name: input.name,
        slug,
        description: input.description,
        price: input.price,
        mrp: input.mrp,
        unit: input.unit,
        unitLabel: input.unitLabel,
        isActive: input.isActive,
      },
      categoryId: input.categoryId,
      sellerId,
      stock: input.stock,
      images,
    });
    return toProductDTO(product);
  },

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductDTO> {
    const existing = await productRepository.findById(id);
    if (!existing) throw new NotFoundError('Product');

    const { images, categoryId, ...rest } = input;
    await productRepository.update(id, {
      ...rest,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    });

    if (images) {
      const normalised = images.map((img, idx) => ({ ...img, isPrimary: img.isPrimary ?? idx === 0, sortOrder: img.sortOrder ?? idx }));
      await productRepository.replaceImages(id, normalised);
    }

    return this.getProduct(id);
  },

  async deleteProduct(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new NotFoundError('Product');
    await productRepository.delete(id);
  },

  // ── Inventory ────────────────────────────────────────────────────────
  async updateInventory(productId: string, data: { stock?: number; isOutOfStock?: boolean; lowStockThreshold?: number }) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product');
    // Auto-flag out-of-stock when stock hits zero unless explicitly overridden.
    const isOutOfStock = data.isOutOfStock ?? (data.stock !== undefined ? data.stock <= 0 : undefined);
    await inventoryRepository.upsert(productId, { ...data, isOutOfStock });
    return this.getProduct(productId);
  },

  // ── Image upload SAS ─────────────────────────────────────────────────
  generateUploadUrl(opts: { ext: string; prefix: string }) {
    return blobStorage.generateUploadSas({ ext: opts.ext, prefix: opts.prefix });
  },
};

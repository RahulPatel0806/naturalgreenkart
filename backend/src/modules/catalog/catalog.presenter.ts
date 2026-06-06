/** Maps Prisma catalog entities to API DTOs (serialises Decimal money to numbers). */
import { moneyToNumber } from '@/core/utils/money';
import type { ProductWithRelations } from '@/repositories/catalog.repository';
import type { Category, ProductUnit } from '@prisma/client';

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  price: number;
  mrp: number;
  discountPercent: number;
  unit: ProductUnit;
  unitLabel: string;
  isActive: boolean;
  inStock: boolean;
  stock: number;
  primaryImage: string | null;
  images: ProductImageDTO[];
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function toCategoryDTO(c: Category): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
  };
}

export function toProductDTO(p: ProductWithRelations): ProductDTO {
  const price = moneyToNumber(p.price);
  const mrp = moneyToNumber(p.mrp);
  const stock = p.inventory?.stock ?? 0;
  const inStock = !!p.inventory && !p.inventory.isOutOfStock && stock > 0;
  const images = p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, isPrimary: i.isPrimary }));

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    price,
    mrp,
    discountPercent: mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0,
    unit: p.unit,
    unitLabel: p.unitLabel,
    isActive: p.isActive,
    inStock,
    stock,
    primaryImage: images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null,
    images,
  };
}

import { z } from 'zod';
import { paginationSchema } from './common';

export const productUnitSchema = z.enum(['KG', 'GRAM', 'LITRE', 'ML', 'PIECE', 'PACK', 'DOZEN', 'BUNCH']);

export const productListQuerySchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  search: z.string().trim().max(80).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

export const categoryQuerySchema = z.object({
  activeOnly: z.coerce.boolean().default(true),
});

const imageInputSchema = z.object({
  url: z.string().url(),
  alt: z.string().max(120).optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional(),
    categoryId: z.string().min(1),
    price: z.number().positive().max(1_000_000),
    mrp: z.number().positive().max(1_000_000),
    unit: productUnitSchema.default('PIECE'),
    unitLabel: z.string().trim().min(1).max(40),
    stock: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
    images: z.array(imageInputSchema).max(8).default([]),
  })
  .refine((d) => d.price <= d.mrp, { message: 'price cannot exceed mrp', path: ['price'] });

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().positive().max(1_000_000).optional(),
  mrp: z.number().positive().max(1_000_000).optional(),
  unit: productUnitSchema.optional(),
  unitLabel: z.string().trim().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
  images: z.array(imageInputSchema).max(8).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const updateInventorySchema = z.object({
  stock: z.number().int().min(0).optional(),
  isOutOfStock: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

import { z } from 'zod';
import { paginationSchema } from './common';

export const userListQuerySchema = paginationSchema.extend({
  role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN']).optional(),
  search: z.string().trim().max(60).optional(),
  isBlocked: z.coerce.boolean().optional(),
});

export const blockUserSchema = z.object({
  isBlocked: z.boolean(),
});

export const updateSettingSchema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.any(),
});

export const uploadSasSchema = z.object({
  ext: z.enum(['jpg', 'jpeg', 'png', 'webp']).default('jpg'),
  prefix: z.enum(['products', 'categories']).default('products'),
});

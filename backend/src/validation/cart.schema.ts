import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0).max(99), // 0 removes the item
});

export const removeCartItemSchema = z.object({
  productId: z.string().min(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

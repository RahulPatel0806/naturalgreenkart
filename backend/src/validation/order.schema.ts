import { z } from 'zod';
import { paginationSchema } from './common';

export const placeOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.literal('COD').default('COD'),
  notes: z.string().trim().max(300).optional(),
});

export const orderListQuerySchema = paginationSchema;

export const adminOrderListQuerySchema = paginationSchema.extend({
  status: z
    .enum(['PENDING', 'ACCEPTED', 'REJECTED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
    .optional(),
  search: z.string().trim().max(60).optional(),
});

/** Statuses a seller/admin may transition an order into. */
export const updateOrderStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  reason: z.string().trim().max(300).optional(),
});

export const reorderSchema = z.object({
  orderId: z.string().min(1),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

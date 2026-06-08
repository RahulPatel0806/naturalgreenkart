import { z } from 'zod';
import { imageUrlSchema } from './common';

const discountTypeSchema = z.enum(['PERCENT', 'FLAT']);

/** Coupon code: alphanumeric, normalised to uppercase. */
const couponCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(24)
  .regex(/^[A-Za-z0-9]+$/, 'Use letters and numbers only')
  .transform((v) => v.toUpperCase());

/** Optional ISO date string → Date (accepts "" / null as undefined). */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : undefined))
  .refine((d) => d === undefined || !Number.isNaN(d.getTime()), { message: 'Invalid date' });

const couponBaseSchema = z.object({
  code: couponCodeSchema,
  description: z.string().trim().max(160).optional(),
  discountType: discountTypeSchema.default('PERCENT'),
  discountValue: z.number().positive().max(1_000_000),
  maxDiscount: z.number().positive().max(1_000_000).optional(),
  minOrderSubtotal: z.number().min(0).max(1_000_000).default(0),
  usageLimit: z.number().int().min(1).max(1_000_000).optional(),
  perUserLimit: z.number().int().min(1).max(1000).optional(),
  startsAt: optionalDate,
  expiresAt: optionalDate,
  isActive: z.boolean().default(true),
});

const percentWithinRange = (d: { discountType?: string; discountValue?: number }) =>
  d.discountType !== 'PERCENT' || d.discountValue === undefined || d.discountValue <= 100;
const expiryAfterStart = (d: { startsAt?: Date; expiresAt?: Date }) =>
  !d.startsAt || !d.expiresAt || d.expiresAt > d.startsAt;

export const createCouponSchema = couponBaseSchema
  .refine(percentWithinRange, { message: 'Percent discount cannot exceed 100', path: ['discountValue'] })
  .refine(expiryAfterStart, { message: 'Expiry must be after the start date', path: ['expiresAt'] });

export const updateCouponSchema = couponBaseSchema
  .partial()
  .refine(percentWithinRange, { message: 'Percent discount cannot exceed 100', path: ['discountValue'] })
  .refine(expiryAfterStart, { message: 'Expiry must be after the start date', path: ['expiresAt'] });

export const createBannerSchema = z.object({
  title: z.string().trim().min(2).max(80),
  subtitle: z.string().trim().max(120).optional(),
  imageUrl: imageUrlSchema,
  couponId: z.string().min(1).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: optionalDate,
  expiresAt: optionalDate,
});

export const updateBannerSchema = createBannerSchema.partial();

export const applyCouponSchema = z.object({
  code: couponCodeSchema,
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

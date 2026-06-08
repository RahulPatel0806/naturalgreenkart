/** Maps coupon/banner entities to API DTOs. */
import { moneyToNumber } from '@/core/utils/money';
import type { Coupon, DiscountType } from '@prisma/client';
import type { BannerWithCoupon } from '@/repositories/offer.repository';

export interface CouponDTO {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface BannerDTO {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  couponId: string | null;
  couponCode: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}

/** Discount preview returned when a customer applies a coupon. */
export interface CouponPreviewDTO {
  code: string;
  description: string | null;
  discount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function toCouponDTO(c: Coupon): CouponDTO {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: moneyToNumber(c.discountValue),
    maxDiscount: c.maxDiscount === null ? null : moneyToNumber(c.maxDiscount),
    minOrderSubtotal: moneyToNumber(c.minOrderSubtotal),
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    startsAt: c.startsAt?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toBannerDTO(b: BannerWithCoupon): BannerDTO {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.imageUrl,
    couponId: b.couponId,
    couponCode: b.coupon?.code ?? null,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    startsAt: b.startsAt?.toISOString() ?? null,
    expiresAt: b.expiresAt?.toISOString() ?? null,
  };
}

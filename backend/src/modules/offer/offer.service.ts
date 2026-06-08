/**
 * Offers: admin-managed discount coupons + promotional home banners.
 *
 * Coupon discount is computed from a pure helper and validated against the
 * coupon's activity window, minimum-order, and usage/per-user limits. The same
 * rules back both the customer "apply coupon" preview and the authoritative
 * re-validation performed inside the order-placement transaction.
 */
import type { Prisma } from '@/core/db/prisma';
import { couponRepository, bannerRepository } from '@/repositories/offer.repository';
import { cartService } from '@/modules/cart/cart.service';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error';
import { moneyToNumber } from '@/core/utils/money';
import { toCouponDTO, toBannerDTO, type CouponPreviewDTO } from './offer.presenter';
import type {
  CreateCouponInput,
  UpdateCouponInput,
  CreateBannerInput,
  UpdateBannerInput,
} from '@/validation/offer.schema';
import type { Coupon } from '@prisma/client';

type CouponLike = Pick<
  Coupon,
  'isActive' | 'startsAt' | 'expiresAt' | 'usageLimit' | 'usedCount' | 'perUserLimit' | 'minOrderSubtotal' | 'discountType' | 'discountValue' | 'maxDiscount'
>;

/** Throws a friendly BadRequestError if the coupon cannot be applied. */
function assertUsable(coupon: CouponLike, subtotal: number, redemptionsForUser: number, now: Date): void {
  if (!coupon.isActive) throw new BadRequestError('This coupon is no longer available');
  if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('This coupon is not active yet');
  if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestError('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new BadRequestError('This coupon has reached its usage limit');
  }
  if (coupon.perUserLimit !== null && redemptionsForUser >= coupon.perUserLimit) {
    throw new BadRequestError('You have already used this coupon');
  }
  const min = moneyToNumber(coupon.minOrderSubtotal);
  if (subtotal < min) throw new BadRequestError(`Add items worth ₹${min} or more to use this coupon`);
}

/** Pure discount calculation (never exceeds the cart subtotal). */
function computeDiscount(coupon: CouponLike, subtotal: number): number {
  const value = moneyToNumber(coupon.discountValue);
  let discount = coupon.discountType === 'PERCENT' ? (subtotal * value) / 100 : value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, moneyToNumber(coupon.maxDiscount));
  discount = Math.min(discount, subtotal);
  return Number(Math.max(0, discount).toFixed(2));
}

export const offerService = {
  // ── Coupons (admin) ──────────────────────────────────────────────────
  async listCoupons() {
    const rows = await couponRepository.list();
    return rows.map(toCouponDTO);
  },

  async createCoupon(input: CreateCouponInput) {
    const existing = await couponRepository.findByCode(input.code);
    if (existing) throw new BadRequestError('A coupon with this code already exists');
    const created = await couponRepository.create(input as Prisma.CouponCreateInput);
    return toCouponDTO(created);
  },

  async updateCoupon(id: string, input: UpdateCouponInput) {
    const existing = await couponRepository.findById(id);
    if (!existing) throw new NotFoundError('Coupon');
    if (input.code && input.code !== existing.code) {
      const clash = await couponRepository.findByCode(input.code);
      if (clash) throw new BadRequestError('A coupon with this code already exists');
    }
    const updated = await couponRepository.update(id, input as Prisma.CouponUpdateInput);
    return toCouponDTO(updated);
  },

  async deleteCoupon(id: string) {
    const existing = await couponRepository.findById(id);
    if (!existing) throw new NotFoundError('Coupon');
    await couponRepository.delete(id);
  },

  // ── Banners (admin) ──────────────────────────────────────────────────
  async listBanners() {
    const rows = await bannerRepository.list();
    return rows.map(toBannerDTO);
  },

  async createBanner(input: CreateBannerInput) {
    const { couponId, ...rest } = input;
    if (couponId) {
      const coupon = await couponRepository.findById(couponId);
      if (!coupon) throw new NotFoundError('Coupon');
    }
    const created = await bannerRepository.create({
      ...rest,
      ...(couponId ? { coupon: { connect: { id: couponId } } } : {}),
    });
    return toBannerDTO(created);
  },

  async updateBanner(id: string, input: UpdateBannerInput) {
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new NotFoundError('Offer banner');
    const { couponId, ...rest } = input;
    const couponRelation =
      couponId === undefined ? {} : couponId ? { coupon: { connect: { id: couponId } } } : { coupon: { disconnect: true } };
    if (couponId) {
      const coupon = await couponRepository.findById(couponId);
      if (!coupon) throw new NotFoundError('Coupon');
    }
    const updated = await bannerRepository.update(id, { ...rest, ...couponRelation });
    return toBannerDTO(updated);
  },

  async deleteBanner(id: string) {
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new NotFoundError('Offer banner');
    await bannerRepository.delete(id);
  },

  // ── Customer ─────────────────────────────────────────────────────────
  async listActiveBanners() {
    const rows = await bannerRepository.listActive(new Date());
    return rows.map(toBannerDTO);
  },

  /** Validate a coupon against the customer's current cart and preview the discount. */
  async previewCoupon(userId: string, code: string): Promise<CouponPreviewDTO> {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) throw new BadRequestError('Invalid coupon code');

    const cart = await cartService.getSummary(userId);
    if (cart.itemCount === 0) throw new BadRequestError('Your cart is empty');

    const redemptions = coupon.perUserLimit !== null ? await couponRepository.countRedemptionsForUser(coupon.id, userId) : 0;
    assertUsable(coupon, cart.subtotal, redemptions, new Date());

    const discount = computeDiscount(coupon, cart.subtotal);
    return {
      code: coupon.code,
      description: coupon.description,
      discount,
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: Number(Math.max(0, cart.subtotal + cart.deliveryFee - discount).toFixed(2)),
    };
  },

  /**
   * Re-validate and lock in a coupon inside the order-placement transaction.
   * Atomically increments `usedCount` (guarded against the usage limit) and
   * returns the snapshot fields to persist on the order.
   */
  async resolveCouponForOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    code: string,
    subtotal: number,
  ): Promise<{ couponId: string; code: string; discount: number }> {
    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon) throw new BadRequestError('Invalid coupon code');

    const redemptions =
      coupon.perUserLimit !== null ? await tx.order.count({ where: { couponId: coupon.id, userId } }) : 0;
    assertUsable(coupon, subtotal, redemptions, new Date());

    const discount = computeDiscount(coupon, subtotal);

    if (coupon.usageLimit !== null) {
      const res = await tx.coupon.updateMany({
        where: { id: coupon.id, usedCount: { lt: coupon.usageLimit } },
        data: { usedCount: { increment: 1 } },
      });
      if (res.count === 0) throw new BadRequestError('This coupon has reached its usage limit');
    } else {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }

    return { couponId: coupon.id, code: coupon.code, discount };
  },
};

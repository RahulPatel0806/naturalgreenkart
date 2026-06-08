/** Data access for coupons and promotional banners. */
import { prisma, type Prisma } from '@/core/db/prisma';

export const couponRepository = {
  list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  },

  findById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  },

  findByCode(code: string) {
    return prisma.coupon.findUnique({ where: { code } });
  },

  create(data: Prisma.CouponCreateInput) {
    return prisma.coupon.create({ data });
  },

  update(id: string, data: Prisma.CouponUpdateInput) {
    return prisma.coupon.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.coupon.delete({ where: { id } });
  },

  /** Count how many times a given coupon has been redeemed by one customer. */
  countRedemptionsForUser(couponId: string, userId: string) {
    return prisma.order.count({ where: { couponId, userId } });
  },
};

const bannerInclude = { coupon: { select: { code: true, isActive: true } } } satisfies Prisma.OfferBannerInclude;
export type BannerWithCoupon = Prisma.OfferBannerGetPayload<{ include: typeof bannerInclude }>;

export const bannerRepository = {
  list() {
    return prisma.offerBanner.findMany({ include: bannerInclude, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  },

  /** Active banners currently within their (optional) validity window. */
  listActive(now: Date) {
    return prisma.offerBanner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        ],
      },
      include: bannerInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  },

  findById(id: string) {
    return prisma.offerBanner.findUnique({ where: { id }, include: bannerInclude });
  },

  create(data: Prisma.OfferBannerCreateInput) {
    return prisma.offerBanner.create({ data, include: bannerInclude });
  },

  update(id: string, data: Prisma.OfferBannerUpdateInput) {
    return prisma.offerBanner.update({ where: { id }, data, include: bannerInclude });
  },

  delete(id: string) {
    return prisma.offerBanner.delete({ where: { id } });
  },
};

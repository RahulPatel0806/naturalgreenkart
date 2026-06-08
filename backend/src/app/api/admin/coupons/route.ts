import { withHandler } from '@/middleware/with-handler';
import { ok, created } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { createCouponSchema } from '@/validation/offer.schema';
import { offerService } from '@/modules/offer/offer.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const GET = withHandler(async () => ok(await offerService.listCoupons()), adminOnly);

export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createCouponSchema);
  const coupon = await offerService.createCoupon(input);
  await auditService.log('COUPON_CREATED', 'Coupon', coupon.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return created(coupon);
}, adminOnly);

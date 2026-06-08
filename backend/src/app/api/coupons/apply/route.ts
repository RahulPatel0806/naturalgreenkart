import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { applyCouponSchema } from '@/validation/offer.schema';
import { offerService } from '@/modules/offer/offer.service';
import { RoleName } from '@prisma/client';

/** Validate a coupon against the customer's current cart and preview the discount. */
export const POST = withHandler(async (req, ctx) => {
  const { code } = await parseBody(req, applyCouponSchema);
  const preview = await offerService.previewCoupon(ctx.auth.id, code);
  return ok(preview);
}, { auth: true, roles: [RoleName.CUSTOMER] });

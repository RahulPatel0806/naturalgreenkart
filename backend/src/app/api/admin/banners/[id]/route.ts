import { withHandler } from '@/middleware/with-handler';
import { ok, noContent } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateBannerSchema } from '@/validation/offer.schema';
import { offerService } from '@/modules/offer/offer.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const PUT = withHandler<{ id: string }>(async (req, ctx) => {
  const input = await parseBody(req, updateBannerSchema);
  const banner = await offerService.updateBanner(ctx.params.id, input);
  await auditService.log('BANNER_UPDATED', 'OfferBanner', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return ok(banner);
}, adminOnly);

export const DELETE = withHandler<{ id: string }>(async (_req, ctx) => {
  await offerService.deleteBanner(ctx.params.id);
  await auditService.log('BANNER_DELETED', 'OfferBanner', ctx.params.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return noContent();
}, adminOnly);

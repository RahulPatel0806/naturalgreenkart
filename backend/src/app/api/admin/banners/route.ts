import { withHandler } from '@/middleware/with-handler';
import { ok, created } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { createBannerSchema } from '@/validation/offer.schema';
import { offerService } from '@/modules/offer/offer.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

export const GET = withHandler(async () => ok(await offerService.listBanners()), adminOnly);

export const POST = withHandler(async (req, ctx) => {
  const input = await parseBody(req, createBannerSchema);
  const banner = await offerService.createBanner(input);
  await auditService.log('BANNER_CREATED', 'OfferBanner', banner.id, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent });
  return created(banner);
}, adminOnly);

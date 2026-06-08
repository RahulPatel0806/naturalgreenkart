import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { offerService } from '@/modules/offer/offer.service';

/** Active promotional banners for the customer home carousel. */
export const GET = withHandler(async () => ok(await offerService.listActiveBanners()));

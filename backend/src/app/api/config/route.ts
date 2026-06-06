import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { settingsService } from '@/modules/settings/settings.service';

/** GET /api/config — public store configuration consumed by the mobile app. */
export const GET = withHandler(async () => {
  const config = await settingsService.getStoreConfig();
  return ok(config);
});

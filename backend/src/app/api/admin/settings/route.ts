import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { updateSettingSchema } from '@/validation/admin.schema';
import { settingsService } from '@/modules/settings/settings.service';
import { auditService } from '@/modules/audit/audit.service';
import { RoleName } from '@prisma/client';

const adminOnly = { auth: true as const, roles: [RoleName.ADMIN] };

/** GET /api/admin/settings — all app settings (raw key/value). */
export const GET = withHandler(async () => ok(await settingsService.getAll()), adminOnly);

/** PUT /api/admin/settings — upsert a single setting. */
export const PUT = withHandler(async (req, ctx) => {
  const { key, value } = await parseBody(req, updateSettingSchema);
  const updated = await settingsService.update(key, value);
  await auditService.log('SETTING_UPDATED', 'AppSetting', key, { actorId: ctx.auth.id, ip: ctx.ip, userAgent: ctx.userAgent }, { key });
  return ok({ key: updated.key, value: updated.value });
}, adminOnly);

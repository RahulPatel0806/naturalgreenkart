import { withHandler } from '@/middleware/with-handler';
import { ok, buildPaginationMeta } from '@/core/http/api-response';
import { parseQuery } from '@/validation/common';
import { paginationSchema } from '@/validation/common';
import { notificationService } from '@/modules/notification/notification.service';

export const GET = withHandler(async (req, ctx) => {
  const q = parseQuery(req.nextUrl, paginationSchema);
  const result = await notificationService.list(ctx.auth.id, q);
  return ok(result.items, {
    meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total), unread: result.unread },
  });
}, { auth: true });

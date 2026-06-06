import { withHandler } from '@/middleware/with-handler';
import { ok, buildPaginationMeta } from '@/core/http/api-response';
import { parseQuery } from '@/validation/common';
import { userListQuerySchema } from '@/validation/admin.schema';
import { adminUserService } from '@/modules/user/admin-user.service';
import { RoleName } from '@prisma/client';

export const GET = withHandler(async (req) => {
  const q = parseQuery(req.nextUrl, userListQuerySchema);
  const result = await adminUserService.list(q);
  return ok(result.items, { meta: { pagination: buildPaginationMeta(result.page, result.pageSize, result.total) } });
}, { auth: true, roles: [RoleName.ADMIN] });

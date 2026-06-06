import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { blockUserSchema } from '@/validation/admin.schema';
import { adminUserService } from '@/modules/user/admin-user.service';
import { RoleName } from '@prisma/client';

/** PATCH /api/admin/users/:id/block — block or unblock a customer/seller. */
export const PATCH = withHandler<{ id: string }>(async (req, ctx) => {
  const { isBlocked } = await parseBody(req, blockUserSchema);
  const user = await adminUserService.setBlocked(ctx.auth.id, ctx.params.id, isBlocked, {
    actorId: ctx.auth.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });
  return ok(user);
}, { auth: true, roles: [RoleName.ADMIN] });

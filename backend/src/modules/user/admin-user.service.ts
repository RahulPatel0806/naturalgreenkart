/** Admin-side user management (list, view, block/unblock). */
import { userRepository } from '@/repositories/user.repository';
import { auditService, type AuditContext } from '@/modules/audit/audit.service';
import { BadRequestError, NotFoundError } from '@/core/errors/app-error';
import type { PageParams } from '@/repositories/pagination';
import { RoleName } from '@prisma/client';

function toAdminUserDTO(u: { id: string; phone: string; name: string | null; email: string | null; isBlocked: boolean; isActive: boolean; createdAt: Date; role: { name: RoleName } }) {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    email: u.email,
    role: u.role.name,
    isBlocked: u.isBlocked,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  };
}

export const adminUserService = {
  async list(params: PageParams & { role?: RoleName; search?: string; isBlocked?: boolean }) {
    const result = await userRepository.list(params);
    return { ...result, items: result.items.map(toAdminUserDTO) };
  },

  async get(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    return toAdminUserDTO(user);
  },

  async setBlocked(adminId: string, userId: string, isBlocked: boolean, ctx: AuditContext) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User');
    if (user.role.name === RoleName.ADMIN) throw new BadRequestError('Admin accounts cannot be blocked');
    if (userId === adminId) throw new BadRequestError('You cannot block your own account');

    await userRepository.setBlocked(userId, isBlocked);
    // Blocking revokes all sessions so the user is logged out immediately.
    if (isBlocked) {
      const { refreshTokenRepository } = await import('@/repositories/user.repository');
      await refreshTokenRepository.revokeAllForUser(userId);
    }
    await auditService.log(isBlocked ? 'USER_BLOCKED' : 'USER_UNBLOCKED', 'User', userId, ctx);
    return this.get(userId);
  },
};

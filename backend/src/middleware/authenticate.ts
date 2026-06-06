/**
 * Authentication + authorization primitives.
 * `authenticate` verifies the bearer token and loads a minimal principal,
 * also enforcing the user is active and not blocked (defence in depth — a
 * blocked user's still-valid access token is rejected here).
 */
import { verifyAccessToken } from '@/core/security/jwt';
import { prisma } from '@/core/db/prisma';
import { ForbiddenError, UnauthorizedError } from '@/core/errors/app-error';
import type { AuthUser } from '@/types/auth';
import type { RoleName } from '@prisma/client';

function extractBearer(req: Request): string {
  const header = req.headers.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }
  return token;
}

export async function authenticate(req: Request): Promise<AuthUser> {
  const token = extractBearer(req);
  const claims = await verifyAccessToken(token);

  // Verify the user still exists and is permitted to act.
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, phone: true, isBlocked: true, isActive: true, role: { select: { name: true } } },
  });

  if (!user || !user.isActive) throw new UnauthorizedError('Account no longer active');
  if (user.isBlocked) throw new ForbiddenError('Your account has been blocked');

  return { id: user.id, phone: user.phone, role: user.role.name };
}

export function authorize(user: AuthUser, allowed: RoleName[]): void {
  if (!allowed.includes(user.role)) {
    throw new ForbiddenError(`Requires one of roles: ${allowed.join(', ')}`);
  }
}

import type { RoleName } from '@prisma/client';

/** The authenticated principal attached to a request after token verification. */
export interface AuthUser {
  id: string;
  role: RoleName;
  phone: string;
}

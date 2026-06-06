/**
 * JWT issuance & verification using `jose` (Edge & Node compatible).
 * Two token types:
 *   - access  : short-lived, carries identity + role, sent on every request.
 *   - refresh : long-lived, opaque-ish; its jti is persisted (hashed) so it can
 *               be rotated and revoked server-side.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { randomUUID } from 'node:crypto';
import { env } from '@/core/config/env';
import type { RoleName } from '@prisma/client';
import { UnauthorizedError } from '@/core/errors/app-error';

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface AccessTokenClaims extends JWTPayload {
  sub: string; // user id
  role: RoleName;
  phone: string;
  type: 'access';
}

export interface RefreshTokenClaims extends JWTPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export async function signAccessToken(params: {
  userId: string;
  role: RoleName;
  phone: string;
}): Promise<string> {
  return new SignJWT({ role: params.role, phone: params.phone, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(params.userId)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(`${env.JWT_ACCESS_TTL}s`)
    .sign(accessSecret);
}

export async function signRefreshToken(userId: string): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({ type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(`${env.JWT_REFRESH_TTL}s`)
    .sign(refreshSecret);
  return { token, jti };
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    if (payload.type !== 'access') throw new Error('wrong token type');
    return payload as AccessTokenClaims;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
    if (payload.type !== 'refresh') throw new Error('wrong token type');
    return payload as RefreshTokenClaims;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

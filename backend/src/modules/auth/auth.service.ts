/**
 * Authentication service — phone + OTP login with JWT access/refresh tokens.
 *
 * Security properties:
 *  • OTP codes are random, hashed at rest, single-use, expiring, attempt-limited.
 *  • A resend cooldown prevents OTP flooding for a given number.
 *  • Refresh tokens are persisted hashed and rotated on every refresh (reuse of
 *    an old token is detected and rejected).
 *  • New phone numbers auto-register as CUSTOMER (seller/admin are provisioned
 *    by an admin, never self-service).
 */
import { env } from '@/core/config/env';
import { generateOtp, otpExpiry } from '@/core/security/otp';
import { hashSecret, verifySecret } from '@/core/security/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/core/security/jwt';
import { sendOtpSms } from '@/core/storage/sms';
import { logger } from '@/core/logger/logger';
import {
  BadRequestError,
  ForbiddenError,
  RateLimitError,
  UnauthorizedError,
} from '@/core/errors/app-error';
import { userRepository, otpRepository, refreshTokenRepository } from '@/repositories/user.repository';
import { RoleName } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user: { id: string; phone: string; name: string | null; role: RoleName };
}

export const authService = {
  /** Step 1 — issue an OTP for the phone number. */
  async requestOtp(phone: string): Promise<{ devCode?: string; resendIn: number }> {
    const last = await otpRepository.latest(phone);
    if (last) {
      const elapsed = (Date.now() - last.createdAt.getTime()) / 1000;
      if (elapsed < env.OTP_RESEND_COOLDOWN) {
        throw new RateLimitError(Math.ceil(env.OTP_RESEND_COOLDOWN - elapsed), 'Please wait before requesting another OTP');
      }
    }

    const code = generateOtp();
    const codeHash = await hashSecret(code);
    await otpRepository.create({ phone, codeHash, expiresAt: otpExpiry() });
    await sendOtpSms(phone, code);

    logger.info({ phone }, 'otp issued');
    // In dev mode we surface the code so testers can log in without an SMS gateway.
    return { devCode: env.OTP_DEV_MODE ? code : undefined, resendIn: env.OTP_RESEND_COOLDOWN };
  },

  /** Step 2 — verify the OTP, (auto-register if new), and return tokens. */
  async verifyOtp(
    phone: string,
    code: string,
    ctx: { ip?: string; userAgent?: string; name?: string },
  ): Promise<AuthResult> {
    const otp = await otpRepository.latestActive(phone);
    if (!otp) throw new BadRequestError('OTP expired or not requested. Please request a new one.');

    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
      throw new RateLimitError(60, 'Too many incorrect attempts. Request a new OTP.');
    }

    const valid = await verifySecret(code, otp.codeHash);
    if (!valid) {
      await otpRepository.incrementAttempts(otp.id);
      throw new UnauthorizedError('Incorrect OTP');
    }

    await otpRepository.consume(otp.id);

    // Find or auto-register the user (new numbers become customers).
    let user = await userRepository.findByPhone(phone);
    if (!user) {
      const roleId = await userRepository.getRoleId(RoleName.CUSTOMER);
      user = await userRepository.create({ phone, roleId, name: ctx.name });
    } else if (user.isBlocked) {
      throw new ForbiddenError('Your account has been blocked');
    } else if (ctx.name && !user.name) {
      user = await userRepository.update(user.id, { name: ctx.name });
    }

    const tokens = await this.issueTokens(user.id, user.role.name, user.phone, ctx);
    return { ...tokens, user: { id: user.id, phone: user.phone, name: user.name, role: user.role.name } };
  },

  /** Rotate tokens given a valid, non-revoked refresh token. */
  async refresh(refreshToken: string, ctx: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const claims = await verifyRefreshToken(refreshToken);
    const tokenHash = await hashSecret(refreshToken);

    // Look up by exact hash. (bcrypt hashes differ per call, so we verify by scanning the user's tokens.)
    const stored = await this.findStoredRefreshToken(claims.sub, refreshToken);
    if (!stored) throw new UnauthorizedError('Refresh token has been revoked or reused');

    const user = await userRepository.findById(claims.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('Account no longer active');
    if (user.isBlocked) throw new ForbiddenError('Your account has been blocked');

    // Rotate: revoke the used token, issue a fresh pair.
    await refreshTokenRepository.revoke(stored.id);
    void tokenHash;
    return this.issueTokens(user.id, user.role.name, user.phone, ctx);
  },

  async logout(userId: string, refreshToken?: string, allDevices?: boolean): Promise<void> {
    if (allDevices) {
      await refreshTokenRepository.revokeAllForUser(userId);
      return;
    }
    if (refreshToken) {
      const stored = await this.findStoredRefreshToken(userId, refreshToken);
      if (stored) await refreshTokenRepository.revoke(stored.id);
    }
  },

  // ── internals ──────────────────────────────────────────────────────────

  async issueTokens(
    userId: string,
    role: RoleName,
    phone: string,
    ctx: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const accessToken = await signAccessToken({ userId, role, phone });
    const { token: refreshToken } = await signRefreshToken(userId);
    const tokenHash = await hashSecret(refreshToken);
    await refreshTokenRepository.create({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_TTL * 1000),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { accessToken, refreshToken, expiresIn: env.JWT_ACCESS_TTL };
  },

  /** bcrypt hashes are salted, so we cannot equality-match; verify against active tokens. */
  async findStoredRefreshToken(userId: string, plain: string) {
    const { prisma } = await import('@/core/db/prisma');
    const candidates = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    for (const c of candidates) {
      if (await verifySecret(plain, c.tokenHash)) return c;
    }
    return null;
  },
};

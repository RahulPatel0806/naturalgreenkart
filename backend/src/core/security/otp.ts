/**
 * OTP generation. Codes are numeric, cryptographically random, and never stored
 * in plain text (see hash.ts). Delivery is abstracted behind the SMS sender.
 */
import { randomInt } from 'node:crypto';
import { env } from '@/core/config/env';

export function generateOtp(length = env.OTP_LENGTH): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max + 1));
}

export function otpExpiry(now = new Date()): Date {
  return new Date(now.getTime() + env.OTP_TTL * 1000);
}

/**
 * Centralised, validated environment configuration.
 * Fail-fast: the process refuses to boot with an invalid/missing config so we
 * never ship a half-configured server to production.
 */
import { z } from 'zod';

const booleanString = z.preprocess(
  (v) => v === true || v === 'true' || v === '1',
  z.boolean(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().default('Natural greenkart'),
  PORT: z.coerce.number().default(4000),
  CORS_ALLOWED_ORIGINS: z.string().default(''),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(2592000),
  JWT_ISSUER: z.string().default('aggrimart'),
  JWT_AUDIENCE: z.string().default('aggrimart-mobile'),

  OTP_TTL: z.coerce.number().default(300),
  OTP_LENGTH: z.coerce.number().min(4).max(8).default(6),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN: z.coerce.number().default(30),
  OTP_DEV_MODE: booleanString.default(true),

  SMS_PROVIDER: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),

  RATE_LIMIT_WINDOW: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(120),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),

  AZURE_STORAGE_CONNECTION_STRING: z.string().optional().default(''),
  AZURE_STORAGE_ACCOUNT_NAME: z.string().optional().default(''),
  AZURE_STORAGE_CONTAINER: z.string().default('product-images'),
  AZURE_BLOB_PUBLIC_BASE_URL: z.string().optional().default(''),

  // Local image storage (default provider). Files are written under UPLOAD_DIR
  // and served via GET /api/uploads/[...path]. UPLOAD_PUBLIC_BASE_URL overrides
  // the served URL host (e.g. behind a CDN); otherwise the request origin is used.
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_PUBLIC_BASE_URL: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. See logs above.');
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';

export const corsOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

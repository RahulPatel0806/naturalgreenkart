/**
 * Route-handler composition wrapper — the single entry point every API route
 * is wrapped with. Centralises cross-cutting concerns so individual handlers
 * stay focused on business logic (SRP / DRY):
 *
 *   • request id + structured request/response logging
 *   • rate limiting (per-IP, configurable bucket)
 *   • authentication + role authorization
 *   • Zod / domain / Prisma error → uniform error envelope translation
 *
 * Usage:
 *   export const GET = withHandler(async (req, ctx) => ok(...), { auth: true, roles: ['ADMIN'] });
 */
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import type { RoleName } from '@prisma/client';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger/logger';
import { getRequestContext, type RequestContext } from '@/core/http/request-context';
import { fail } from '@/core/http/api-response';
import { AppError, RateLimitError } from '@/core/errors/app-error';
import { consumeRateLimit, rateLimitHeaders } from '@/core/security/rate-limit';
import { authenticate, authorize } from '@/middleware/authenticate';
import type { AuthUser } from '@/types/auth';

export interface HandlerContext<TParams = Record<string, string>> extends RequestContext {
  params: TParams;
  /** Present only when `auth: true`. */
  auth: AuthUser;
}

type AuthedHandler<TParams> = (
  req: NextRequest,
  ctx: HandlerContext<TParams>,
) => Promise<Response> | Response;

type AnonHandler<TParams> = (
  req: NextRequest,
  ctx: Omit<HandlerContext<TParams>, 'auth'> & { auth: AuthUser | null },
) => Promise<Response> | Response;

interface BaseOptions {
  rateLimit?: { max: number; windowSeconds?: number; bucket?: string } | false;
}

interface AuthedOptions extends BaseOptions {
  auth: true;
  roles?: RoleName[];
}

interface AnonOptions extends BaseOptions {
  auth?: false;
}

// Next.js 15 passes `{ params: Promise<...> }` as the 2nd argument.
type NextRouteArg<TParams> = { params: Promise<TParams> };

export function withHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: AuthedHandler<TParams>,
  options: AuthedOptions,
): (req: NextRequest, arg: NextRouteArg<TParams>) => Promise<Response>;
export function withHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: AnonHandler<TParams>,
  options?: AnonOptions,
): (req: NextRequest, arg: NextRouteArg<TParams>) => Promise<Response>;
export function withHandler<TParams extends Record<string, string> = Record<string, string>>(
  handler: AuthedHandler<TParams> | AnonHandler<TParams>,
  options: AuthedOptions | AnonOptions = {},
) {
  return async (req: NextRequest, arg?: NextRouteArg<TParams>): Promise<Response> => {
    const ctx = getRequestContext(req);
    const start = Date.now();
    const log = logger.child({ requestId: ctx.requestId, method: req.method, path: req.nextUrl.pathname });

    let extraHeaders: Record<string, string> = {};

    try {
      // 1) Rate limiting (skip if explicitly disabled).
      if (options.rateLimit !== false) {
        const rl = options.rateLimit ?? { max: env.RATE_LIMIT_MAX, windowSeconds: env.RATE_LIMIT_WINDOW };
        const bucket = rl.bucket ?? req.nextUrl.pathname;
        const result = consumeRateLimit(
          `${bucket}:${ctx.ip}`,
          rl.max,
          rl.windowSeconds ?? env.RATE_LIMIT_WINDOW,
        );
        extraHeaders = rateLimitHeaders(result);
      }

      // 2) Authentication + authorization.
      let auth: AuthUser | null = null;
      if (options.auth) {
        auth = await authenticate(req);
        if ('roles' in options && options.roles?.length) authorize(auth, options.roles);
      }

      // 3) Resolve route params (await — Next 15).
      const params = (arg ? await arg.params : {}) as TParams;

      const response = await (handler as AuthedHandler<TParams>)(req, {
        ...ctx,
        params,
        auth: auth as AuthUser,
      });

      for (const [k, v] of Object.entries(extraHeaders)) response.headers.set(k, v);
      response.headers.set('x-request-id', ctx.requestId);
      log.info({ status: response.status, ms: Date.now() - start }, 'request handled');
      return response;
    } catch (err) {
      return handleError(err, log, ctx.requestId, extraHeaders, Date.now() - start);
    }
  };
}

function handleError(
  err: unknown,
  log: typeof logger,
  requestId: string,
  extraHeaders: Record<string, string>,
  ms: number,
): Response {
  const headers = { ...extraHeaders, 'x-request-id': requestId };

  if (err instanceof RateLimitError) {
    log.warn({ ms }, 'rate limited');
    return fail('RATE_LIMITED', err.message, 429, { retryAfter: err.retryAfter }, {
      ...headers,
      'Retry-After': String(err.retryAfter),
    });
  }

  if (err instanceof AppError) {
    log.warn({ code: err.code, status: err.statusCode, ms }, err.message);
    return fail(err.code, err.message, err.statusCode, err.details, headers);
  }

  if (err instanceof ZodError) {
    log.warn({ ms }, 'validation error');
    return fail('VALIDATION_ERROR', 'Validation failed', 422, err.flatten(), headers);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return fail('CONFLICT', 'A record with these details already exists', 409, undefined, headers);
    }
    if (err.code === 'P2025') {
      return fail('NOT_FOUND', 'Resource not found', 404, undefined, headers);
    }
    log.error({ code: err.code, ms }, 'prisma known error');
    return fail('BAD_REQUEST', 'Database request error', 400, undefined, headers);
  }

  // Unknown / programming error — do not leak internals.
  log.error({ err, ms }, 'unhandled error');
  return fail('INTERNAL', 'Something went wrong. Please try again later.', 500, undefined, headers);
}

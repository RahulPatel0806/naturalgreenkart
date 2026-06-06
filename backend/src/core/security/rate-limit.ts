/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * NOTE: This is per-instance. For multi-instance Azure App Service deployments,
 * swap the `store` for a shared backend (Redis / Azure Cache for Redis) — the
 * `RateLimiter` interface stays identical, so callers don't change (DIP).
 */
import { RateLimitError } from '@/core/errors/app-error';

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Opportunistic cleanup to bound memory.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Consume one unit from the bucket identified by `key`.
 * @throws RateLimitError when the limit is exceeded.
 */
export function consumeRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowSeconds * 1000 };
    store.set(key, bucket);
    return { limit, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    throw new RateLimitError(retryAfter);
  }

  existing.count += 1;
  return { limit, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

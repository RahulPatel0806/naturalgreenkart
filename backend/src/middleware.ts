/**
 * Next.js edge middleware — runs before every API route.
 * Handles CORS (incl. preflight) and injects a request id. Per-route concerns
 * (auth, rate limit, validation) live in `withHandler`.
 */
import { NextRequest, NextResponse } from 'next/server';
// Edge runtime: use the global Web Crypto API (node:crypto is unavailable here).
const randomUUID = () => globalThis.crypto.randomUUID();

const ALLOWED = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && (ALLOWED.length === 0 || ALLOWED.includes(origin)) ? origin : ALLOWED[0] ?? '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const requestId = req.headers.get('x-request-id') ?? randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  res.headers.set('x-request-id', requestId);
  return res;
}

export const config = {
  matcher: '/api/:path*',
};

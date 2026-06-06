/**
 * Helpers to derive request metadata (client IP, user-agent, request id).
 * Used by rate limiting, audit logging and structured request logs.
 */
import { randomUUID } from 'node:crypto';

export interface RequestContext {
  requestId: string;
  ip: string;
  userAgent: string;
}

export function getClientIp(req: Request): string {
  const headers = req.headers;
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-client-ip') ??
    'unknown'
  );
}

export function getRequestContext(req: Request): RequestContext {
  return {
    requestId: req.headers.get('x-request-id') ?? randomUUID(),
    ip: getClientIp(req),
    userAgent: req.headers.get('user-agent') ?? 'unknown',
  };
}

/**
 * Uniform API response envelope so every endpoint returns a predictable shape.
 *   success: { success: true, data, meta? }
 *   error:   { success: false, error: { code, message, details? } }
 */
import { NextResponse } from 'next/server';
import type { ErrorCode } from '@/core/errors/app-error';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

export function ok<T>(data: T, init?: { status?: number; meta?: ApiMeta; headers?: HeadersInit }) {
  return NextResponse.json(
    { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function created<T>(data: T, meta?: ApiMeta) {
  return ok(data, { status: 201, meta });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status, headers },
  );
}

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

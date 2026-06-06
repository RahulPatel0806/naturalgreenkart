/** Shared Zod primitives and request-parsing helpers. */
import { z } from 'zod';
import { ValidationError } from '@/core/errors/app-error';

/** Indian mobile number: 10 digits, optionally +91 prefixed. Normalised to 10 digits. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^(\+?91)?/, '').replace(/\s|-/g, ''))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'));

export const otpSchema = z.string().trim().regex(/^\d{4,8}$/, 'Invalid OTP');

export const idSchema = z.string().min(1);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** Parse & validate a JSON body, throwing a domain ValidationError on failure. */
export async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError('Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ValidationError('Validation failed', result.error.flatten());
  return result.data;
}

/** Parse & validate query string params from a URL. */
export function parseQuery<T extends z.ZodTypeAny>(url: URL, schema: T): z.infer<T> {
  const obj = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) throw new ValidationError('Invalid query parameters', result.error.flatten());
  return result.data;
}

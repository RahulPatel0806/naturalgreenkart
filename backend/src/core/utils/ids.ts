/** Domain id/slug helpers. */
import { randomInt } from 'node:crypto';

/** Human-friendly, sortable order number e.g. AGM-20260605-4821. */
export function generateOrderNumber(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(randomInt(1000, 9999));
  return `AGM-${y}${m}${d}-${rand}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

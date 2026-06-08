import { API_BASE_URL } from './config';

/** Origin of the API (base URL without the trailing `/api`), e.g. http://192.168.1.7:4000 */
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');

/**
 * Resolve an image URL coming from the API into one this client can actually load.
 *
 *  • Host-relative paths (`/api/uploads/...`) are resolved against the API origin
 *    the app is configured to use — so the same record works on web (localhost),
 *    a physical device (LAN IP) and in production (public domain).
 *  • Legacy rows that baked in a `localhost`/`127.0.0.1` origin (unreachable from
 *    a real device) are rewritten to the configured API origin.
 *  • Absolute external URLs (e.g. a CDN) are returned unchanged.
 */
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  const legacy = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/i);
  if (legacy) return `${API_ORIGIN}${legacy[1]}`;
  return url;
}

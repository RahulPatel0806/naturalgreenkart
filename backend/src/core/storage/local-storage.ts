/**
 * Local filesystem storage adapter for product / category images.
 *
 * Files are written under `<UPLOAD_DIR>/<prefix>/<uuid>.<ext>` (default
 * `uploads/` at the project root) and served back through the
 * `GET /api/uploads/[...path]` route handler. Keeps the rest of the app
 * decoupled from where bytes actually live (DIP) — swap for Azure/S3 later
 * without touching callers.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger/logger';

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Max upload size in bytes (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Allowed top-level folders so callers can't write outside known prefixes. */
const ALLOWED_PREFIXES = new Set(['products', 'categories']);

export interface SaveResult {
  /** Path relative to the upload root, e.g. `products/uuid.jpg`. */
  relativePath: string;
}

class LocalStorage {
  /** Absolute path to the upload root directory. */
  get root(): string {
    return path.isAbsolute(env.UPLOAD_DIR)
      ? env.UPLOAD_DIR
      : path.join(process.cwd(), env.UPLOAD_DIR);
  }

  /** Persist raw bytes and return the relative path under the upload root. */
  async save(buffer: Buffer, opts: { ext: string; prefix: string }): Promise<SaveResult> {
    const prefix = ALLOWED_PREFIXES.has(opts.prefix) ? opts.prefix : 'products';
    const dir = path.join(this.root, prefix);
    await mkdir(dir, { recursive: true });

    const fileName = `${randomUUID()}.${opts.ext}`;
    await writeFile(path.join(dir, fileName), buffer);

    const relativePath = `${prefix}/${fileName}`;
    logger.debug({ relativePath }, 'image stored locally');
    return { relativePath };
  }

  /**
   * Resolve a request path (e.g. `products/uuid.jpg`) to an absolute fs path,
   * guarding against directory traversal (`..`, absolute paths).
   */
  resolve(relativePath: string): string | null {
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const abs = path.join(this.root, normalized);
    if (!abs.startsWith(this.root + path.sep)) return null;
    return abs;
  }

  async read(relativePath: string): Promise<Buffer | null> {
    const abs = this.resolve(relativePath);
    if (!abs) return null;
    try {
      return await readFile(abs);
    } catch {
      return null;
    }
  }

  async delete(relativePath: string): Promise<void> {
    const abs = this.resolve(relativePath);
    if (!abs) return;
    try {
      await unlink(abs);
    } catch {
      // best-effort — already gone is fine
    }
  }

  /**
   * Build the public URL clients use to load an image.
   *
   * When no external base (CDN / fixed domain) is configured we return a
   * *host-relative* URL (`/api/uploads/<path>`) rather than baking in the
   * request's origin. The same row is served to every client, but each client
   * reaches the API on a different host (localhost on web, the LAN IP on a
   * physical device, a public domain in production) — so each must resolve the
   * path against the origin it actually used. Baking in one origin (e.g.
   * `http://localhost:4000`) makes images unreachable from other clients.
   */
  publicUrl(relativePath: string): string {
    const base = env.UPLOAD_PUBLIC_BASE_URL.replace(/\/$/, '');
    return base ? `${base}/${relativePath}` : `/api/uploads/${relativePath}`;
  }
}

export const localStorage = new LocalStorage();

import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { localStorage } from '@/core/storage/local-storage';

// Reading files from disk requires the Node.js runtime (not edge).
export const runtime = 'nodejs';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/**
 * GET /api/uploads/<prefix>/<file> — serves a locally-stored image.
 * Public (no auth) so <Image> tags can load it; path traversal is guarded by
 * the storage adapter's `resolve()`.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const relativePath = (segments ?? []).join('/');

  const ext = path.extname(relativePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
  }

  const buffer = await localStorage.read(relativePath);
  if (!buffer) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Image not found' } }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

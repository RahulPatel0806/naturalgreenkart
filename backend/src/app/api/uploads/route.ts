import { NextRequest } from 'next/server';
import { ok } from '@/core/http/api-response';
import { ValidationError } from '@/core/errors/app-error';
import { withHandler } from '@/middleware/with-handler';
import { localStorage, ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '@/core/storage/local-storage';
import { RoleName } from '@prisma/client';

// File writes require the Node.js runtime (not edge).
export const runtime = 'nodejs';

/**
 * POST /api/uploads — multipart/form-data image upload.
 * Fields: `file` (required), `prefix` ("products" | "categories", optional).
 * Stores the image on the server under the upload directory and returns the
 * public URL to persist on the product/category.
 */
export const POST = withHandler(
  async (req: NextRequest, ctx) => {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ValidationError('Expected multipart/form-data with a "file" field');
    }

    const file = form.get('file');
    if (!(file instanceof File)) throw new ValidationError('Missing "file" field');

    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) throw new ValidationError('Unsupported image type. Use JPEG, PNG or WebP.');
    if (file.size > MAX_UPLOAD_BYTES) throw new ValidationError('Image is too large (max 5 MB).');

    const prefixParam = form.get('prefix');
    const prefix = prefixParam === 'categories' ? 'categories' : 'products';

    const buffer = Buffer.from(await file.arrayBuffer());
    const { relativePath } = await localStorage.save(buffer, { ext, prefix });
    const url = localStorage.publicUrl(relativePath, req.nextUrl.origin);

    return ok({ url, path: relativePath }, { status: 201 });
  },
  { auth: true, roles: [RoleName.SELLER, RoleName.ADMIN], rateLimit: { max: 30, windowSeconds: 60 } },
);

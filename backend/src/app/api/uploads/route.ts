import { withHandler } from '@/middleware/with-handler';
import { ok } from '@/core/http/api-response';
import { parseBody } from '@/validation/common';
import { uploadSasSchema } from '@/validation/admin.schema';
import { catalogService } from '@/modules/catalog/catalog.service';
import { RoleName } from '@prisma/client';

/**
 * POST /api/uploads — returns a short-lived Azure Blob SAS so the client can
 * upload an image directly to storage, then send back the resulting publicUrl
 * when creating/updating a product.
 */
export const POST = withHandler(async (req) => {
  const { ext, prefix } = await parseBody(req, uploadSasSchema);
  const sas = catalogService.generateUploadUrl({ ext, prefix });
  return ok(sas);
}, { auth: true, roles: [RoleName.SELLER, RoleName.ADMIN] });

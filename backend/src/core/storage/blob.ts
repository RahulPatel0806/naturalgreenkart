/**
 * Azure Blob Storage adapter for product images.
 * Encapsulates all Azure SDK usage so the rest of the app depends only on the
 * small `BlobStorage` surface (DIP) — easy to mock in tests / swap providers.
 */
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  type ContainerClient,
} from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger/logger';

export interface UploadResult {
  url: string;
  blobName: string;
}

class AzureBlobStorage {
  private container: ContainerClient | null = null;

  private getContainer(): ContainerClient {
    if (this.container) return this.container;
    if (!env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    const service = BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING);
    this.container = service.getContainerClient(env.AZURE_STORAGE_CONTAINER);
    return this.container;
  }

  /** Upload raw bytes and return the public URL. */
  async upload(
    buffer: Buffer,
    contentType: string,
    opts?: { prefix?: string; ext?: string },
  ): Promise<UploadResult> {
    const container = this.getContainer();
    const ext = opts?.ext ?? contentType.split('/')[1] ?? 'bin';
    const blobName = `${opts?.prefix ?? 'products'}/${randomUUID()}.${ext}`;
    const blockBlob = container.getBlockBlobClient(blobName);

    await blockBlob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType, blobCacheControl: 'public, max-age=31536000' },
    });

    const url = env.AZURE_BLOB_PUBLIC_BASE_URL
      ? `${env.AZURE_BLOB_PUBLIC_BASE_URL.replace(/\/$/, '')}/${blobName}`
      : blockBlob.url;

    logger.debug({ blobName }, 'blob uploaded');
    return { url, blobName };
  }

  async delete(blobName: string): Promise<void> {
    const container = this.getContainer();
    await container.getBlockBlobClient(blobName).deleteIfExists();
  }

  /**
   * Generate a short-lived write SAS URL so the mobile client can upload
   * directly to Azure (offloading large uploads from the API server).
   */
  generateUploadSas(opts?: { prefix?: string; ext?: string; ttlMinutes?: number }): {
    uploadUrl: string;
    blobName: string;
    publicUrl: string;
  } {
    if (!env.AZURE_STORAGE_ACCOUNT_NAME || !env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('Azure storage account is not fully configured for SAS generation');
    }
    const accountKeyMatch = env.AZURE_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/);
    if (!accountKeyMatch) throw new Error('AccountKey missing from connection string');

    const credential = new StorageSharedKeyCredential(
      env.AZURE_STORAGE_ACCOUNT_NAME,
      accountKeyMatch[1]!,
    );
    const blobName = `${opts?.prefix ?? 'products'}/${randomUUID()}.${opts?.ext ?? 'jpg'}`;
    const expiresOn = new Date(Date.now() + (opts?.ttlMinutes ?? 10) * 60_000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: env.AZURE_STORAGE_CONTAINER,
        blobName,
        permissions: BlobSASPermissions.parse('cw'),
        protocol: SASProtocol.Https,
        expiresOn,
      },
      credential,
    ).toString();

    const base = `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER}/${blobName}`;
    const publicUrl = env.AZURE_BLOB_PUBLIC_BASE_URL
      ? `${env.AZURE_BLOB_PUBLIC_BASE_URL.replace(/\/$/, '')}/${blobName}`
      : base;

    return { uploadUrl: `${base}?${sas}`, blobName, publicUrl };
  }
}

export const blobStorage = new AzureBlobStorage();

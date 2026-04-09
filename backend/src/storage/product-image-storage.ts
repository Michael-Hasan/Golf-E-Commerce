import { diskStorage, StorageEngine } from 'multer';
import { extname, join, normalize } from 'path';
import { mkdirSync } from 'fs';

export interface ProductImageStorage {
  createStorageEngine(): StorageEngine;
  getUploadDir(): string;
  getAssetUrl(filename: string): string;
  generateFilename(originalname: string): string;
}

const DEFAULT_UPLOAD_DIR = join(
  __dirname,
  '..',
  '..',
  'frontend',
  'public',
  'products',
);

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class LocalProductImageStorage implements ProductImageStorage {
  private readonly destination: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const override = process.env.PRODUCT_IMAGE_UPLOAD_DIR?.trim();
    this.destination = normalize(override || DEFAULT_UPLOAD_DIR);
    const baseUrl = process.env.PRODUCT_IMAGE_BASE_URL?.trim() || '/products';
    this.publicBaseUrl = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  }

  getUploadDir(): string {
    return this.destination;
  }

  getAssetUrl(filename: string): string {
    return `${this.publicBaseUrl}/${filename}`;
  }

  generateFilename(originalname: string): string {
    const extension = extname(originalname || '').toLowerCase();
    const base = sanitizeFilename(
      (originalname || 'upload').replace(/\.[^/.]+$/, ''),
    );
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = `${base || 'product'}-${unique}${extension}`;
    return name;
  }

  createStorageEngine(): StorageEngine {
    return diskStorage({
      destination: (_req, _file, cb) => {
        mkdirSync(this.destination, { recursive: true });
        cb(null, this.destination);
      },
      filename: (_req, file, cb) => {
        cb(null, this.generateFilename(file.originalname));
      },
    });
  }
}

// Export a singleton so the controller and later adapters reuse the same config.
export const localProductImageStorage = new LocalProductImageStorage();

/*
  Future extension idea:
  - Implement another ProductImageStorage that uploads to S3/Cloudinary (saving the returned URL and filename).
  - Register those implementations via Nest providers (e.g. `ProductImageStorageToken`) and inject the desired adapter from configuration.
  - Keep the controller agnostic by using the exposed interface methods.
 */

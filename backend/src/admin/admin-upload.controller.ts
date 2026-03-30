import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { HttpAdminGuard } from './guards/http-admin.guard';

/** Repo layout: backend/src/admin or backend/dist/admin → monorepo root is three levels up. */
function resolveProductImagesUploadDir(): string {
  const override = process.env.PRODUCT_IMAGE_UPLOAD_DIR?.trim();
  if (override) {
    return override;
  }
  return join(__dirname, '..', '..', '..', 'frontend', 'public', 'products');
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}

@Controller('admin/uploads')
@UseGuards(AuthGuard('jwt'), HttpAdminGuard)
export class AdminUploadController {
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const targetDir = resolveProductImagesUploadDir();
          mkdirSync(targetDir, { recursive: true });
          cb(null, targetDir);
        },
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname || '').toLowerCase();
          const base = sanitizeFilename(
            (file.originalname || 'upload').replace(/\.[^/.]+$/, ''),
          );
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          cb(null, `${base || 'product'}-${unique}${extension}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const extension = extname(file.originalname || '').toLowerCase();
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowed.includes(extension)) {
          cb(new BadRequestException('Only jpg, jpeg, png, and webp are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadProductImage(@UploadedFile() file: any): { imageUrl: string; filename: string } {
    if (!file?.filename) {
      throw new BadRequestException('No image file uploaded');
    }
    return {
      imageUrl: `/products/${file.filename}`,
      filename: file.filename,
    };
  }
}

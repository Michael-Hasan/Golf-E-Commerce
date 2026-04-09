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
import { extname } from 'path';
import { localProductImageStorage } from '../storage/product-image-storage';
import { HttpAdminGuard } from './guards/http-admin.guard';

type UploadedProductImageFile = {
  filename?: string;
};

/** Repo layout: backend/src/admin or backend/dist/admin → monorepo root is three levels up. */
@Controller('admin/uploads')
@UseGuards(AuthGuard('jwt'), HttpAdminGuard)
export class AdminUploadController {
  @Post('product-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: localProductImageStorage.createStorageEngine(),
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
  uploadProductImage(@UploadedFile() file: UploadedProductImageFile): { imageUrl: string; filename: string } {
    if (!file?.filename) {
      throw new BadRequestException('No image file uploaded');
    }
    return {
      imageUrl: localProductImageStorage.getAssetUrl(file.filename),
      filename: file.filename,
    };
  }
}

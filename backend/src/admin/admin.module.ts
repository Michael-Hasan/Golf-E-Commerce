import { Module } from '@nestjs/common';
import { AdminResolver } from './admin.resolver';
import { UsersRootModule } from '../users/users-root.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUploadController } from './admin-upload.controller';
import { HttpAdminGuard } from './guards/http-admin.guard';

@Module({
  imports: [
    AuthModule,
    UsersRootModule.forRoot({
      useInMemory: process.env.USE_IN_MEMORY_DB !== '0',
    }),
  ],
  controllers: [AdminUploadController],
  providers: [AdminResolver, HttpAdminGuard],
})
export class AdminModule {}

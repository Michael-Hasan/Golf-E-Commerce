import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CatalogProduct } from './catalog-product.entity';
import { CatalogResolver } from './catalog.resolver';
import { CatalogService } from './catalog.service';

const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';

@Module({
  imports: [
    AuthModule,
    ...(useInMemoryDb ? [] : [TypeOrmModule.forFeature([CatalogProduct])]),
  ],
  providers: [CatalogResolver, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}

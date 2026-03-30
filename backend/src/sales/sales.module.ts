import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogProduct } from '../catalog/catalog-product.entity';
import { SalesResolver } from './sales.resolver';
import { SalesService } from './sales.service';

const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';

@Module({
  imports: [
    ...(useInMemoryDb ? [] : [TypeOrmModule.forFeature([CatalogProduct])]),
  ],
  providers: [SalesResolver, SalesService],
  exports: [SalesService],
})
export class SalesModule {}

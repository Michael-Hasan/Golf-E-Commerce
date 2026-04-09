import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { SaleSort } from '../sales/dto/sale-products.input';
import { ClubSort } from '../sales/dto/club-products.input';
import { BallSort } from '../sales/dto/ball-products.input';
import { BagSort } from '../sales/dto/bag-products.input';
import { ApparelSort } from '../sales/dto/apparel-products.input';
import { AccessorySort } from '../sales/dto/accessory-products.input';
import { SaleProduct } from '../sales/models/sale-product.model';
import type { CatalogItem, CatalogSource } from './types/catalog-context';

@Injectable()
export class AiCatalogContextService {
  constructor(private readonly salesService: SalesService) {}

  async getCatalogItems(): Promise<CatalogItem[]> {
    const clubs = (
      await this.salesService.getClubProducts({
        page: 1,
        limit: 100,
        sort: ClubSort.RATING_DESC,
      })
    ).items.map((item) =>
      this.toCatalogItem(item, 'CLUBS', item.price),
    );
    const balls = (
      await this.salesService.getBallProducts({
        page: 1,
        limit: 100,
        sort: BallSort.RATING_DESC,
      })
    ).items.map((item) =>
      this.toCatalogItem(item, 'BALLS', item.price),
    );
    const bags = (
      await this.salesService.getBagProducts({
        page: 1,
        limit: 100,
        sort: BagSort.RATING_DESC,
      })
    ).items.map((item) =>
      this.toCatalogItem(item, 'BAGS', item.price),
    );
    const apparel = (
      await this.salesService.getApparelProducts({
        page: 1,
        limit: 100,
        sort: ApparelSort.RATING_DESC,
      })
    ).items.map((item) =>
      this.toCatalogItem(item, 'APPAREL', item.price),
    );
    const accessories = (
      await this.salesService.getAccessoryProducts({
        page: 1,
        limit: 100,
        sort: AccessorySort.RATING_DESC,
      })
    ).items.map((item) =>
      this.toCatalogItem(item, 'ACCESSORIES', item.price),
    );
    const sale = (
      await this.salesService.getSaleProducts({
        category: 'all',
        sort: SaleSort.RATING_DESC,
      })
    ).map((item) =>
      this.toCatalogItem(item, 'SALE', item.salePrice, item.originalPrice),
    );

    return [...clubs, ...balls, ...bags, ...apparel, ...accessories, ...sale];
  }

  async getSaleProductsForPrompt(): Promise<SaleProduct[]> {
    return this.salesService.getSaleProducts({
      category: 'all',
      sort: SaleSort.DISCOUNT_DESC,
    });
  }

  private toCatalogItem(
    item: {
      id: string;
      category: string;
      brand: string;
      name: string;
      originalPrice?: number;
      rating: number;
    },
    source: CatalogSource,
    price: number,
    originalPrice?: number,
  ): CatalogItem {
    return {
      id: item.id,
      source,
      category: item.category,
      brand: item.brand,
      name: item.name,
      price,
      originalPrice: originalPrice ?? item.originalPrice,
      rating: item.rating,
    };
  }
}

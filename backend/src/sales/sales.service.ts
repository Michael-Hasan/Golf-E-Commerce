import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleProductsInput, SaleSort } from './dto/sale-products.input';
import { SaleProduct } from './models/sale-product.model';
import {
  ClubPriceRange,
  ClubProductsInput,
  ClubSort,
} from './dto/club-products.input';
import { ClubProduct, ClubProductsResult } from './models/club-product.model';
import {
  BallPriceRange,
  BallProductsInput,
  BallSort,
} from './dto/ball-products.input';
import { BallProduct, BallProductsResult } from './models/ball-product.model';
import {
  BagPriceRange,
  BagProductsInput,
  BagSort,
} from './dto/bag-products.input';
import { BagProduct, BagProductsResult } from './models/bag-product.model';
import {
  ApparelPriceRange,
  ApparelProductsInput,
  ApparelSort,
} from './dto/apparel-products.input';
import {
  ApparelProduct,
  ApparelProductsResult,
} from './models/apparel-product.model';
import {
  AccessoryPriceRange,
  AccessoryProductsInput,
  AccessorySort,
} from './dto/accessory-products.input';
import {
  AccessoryProduct,
  AccessoryProductsResult,
} from './models/accessory-product.model';
import { ProductDetail } from './models/product-detail.model';
import { CatalogProduct } from '../catalog/catalog-product.entity';
import { CatalogProductSource } from '../catalog/catalog-product-source.enum';

@Injectable()
export class SalesService {
  constructor(
    @Optional()
    @InjectRepository(CatalogProduct)
    private readonly catalogRepository?: Repository<CatalogProduct>,
  ) {}

  private async loadCatalogBySource(
    source: CatalogProductSource,
  ): Promise<CatalogProduct[]> {
    if (!this.catalogRepository) {
      return [];
    }
    return this.catalogRepository.find({
      where: { source, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** True when list/strike price is higher than the price the customer pays. */
  private isCatalogItemOnSale(item: CatalogProduct): boolean {
    const pay = item.salePrice ?? item.price;
    return item.originalPrice != null && item.originalPrice > pay;
  }

  /**
   * Prefer rows with source SALE. If none exist (common when admins only use
   * category sources), fall back to any active product that has a real discount.
   */
  private async loadSaleCatalogProducts(): Promise<CatalogProduct[]> {
    const saleSource = await this.loadCatalogBySource(
      CatalogProductSource.SALE,
    );
    if (saleSource.length > 0) {
      return saleSource;
    }
    if (!this.catalogRepository) {
      return [];
    }
    const allActive = await this.catalogRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return allActive.filter((item) => this.isCatalogItemOnSale(item));
  }

  /**
   * Sale page sidebar uses five groups; catalog rows use per-source subcategories
   * (e.g. Drivers) or source SALE with a free-text category.
   */
  private resolveSaleGroupLabel(item: CatalogProduct): string {
    if (item.source !== CatalogProductSource.SALE) {
      const bySource: Record<CatalogProductSource, string> = {
        [CatalogProductSource.CLUBS]: 'Clubs',
        [CatalogProductSource.BALLS]: 'Balls',
        [CatalogProductSource.BAGS]: 'Bags',
        [CatalogProductSource.APPAREL]: 'Apparel',
        [CatalogProductSource.ACCESSORIES]: 'Accessories',
        [CatalogProductSource.SALE]: 'Accessories',
      };
      return bySource[item.source] ?? 'Accessories';
    }
    return this.guessSaleGroupFromSaleCategory(item.category);
  }

  private guessSaleGroupFromSaleCategory(category: string): string {
    const c = category.toLowerCase();
    if (
      /\b(bags?|stand bag|cart bag|carry bag|staff bag|travel bag|caddy)\b/.test(
        c,
      )
    ) {
      return 'Bags';
    }
    if (
      /\b(balls?)\b/.test(c) ||
      /\b(tour performance|low compression|distance)\b/.test(c)
    ) {
      return 'Balls';
    }
    if (
      /\b(apparel|polo|pants?|shorts?|shoes?|gloves?|headwear|dri-?fit|shirt|jacket|short)\b/.test(
        c,
      )
    ) {
      return 'Apparel';
    }
    if (
      /\b(accessor|grips?|tees?|divot|rangefinder|gps|training)\b/.test(c)
    ) {
      return 'Accessories';
    }
    if (
      /\b(clubs?|drivers?|irons?|putters?|wedges?|woods?|hybrids?|fairway)\b/.test(
        c,
      )
    ) {
      return 'Clubs';
    }
    return 'Accessories';
  }

  private mapCatalogToSaleProduct(item: CatalogProduct): SaleProduct {
    return {
      id: item.id,
      category: item.category,
      saleGroup: this.resolveSaleGroupLabel(item),
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      salePrice: item.salePrice ?? item.price,
      originalPrice: item.originalPrice ?? item.price,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  private mapCatalogToClubProduct(item: CatalogProduct): ClubProduct {
    return {
      id: item.id,
      category: item.category,
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price,
      originalPrice: item.originalPrice ?? undefined,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  private mapCatalogToBallProduct(item: CatalogProduct): BallProduct {
    return {
      id: item.id,
      category: item.category,
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price,
      originalPrice: item.originalPrice ?? undefined,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  private mapCatalogToBagProduct(item: CatalogProduct): BagProduct {
    return {
      id: item.id,
      category: item.category,
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price,
      originalPrice: item.originalPrice ?? undefined,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  private mapCatalogToApparelProduct(item: CatalogProduct): ApparelProduct {
    return {
      id: item.id,
      category: item.category,
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price,
      originalPrice: item.originalPrice ?? undefined,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  private mapCatalogToAccessoryProduct(item: CatalogProduct): AccessoryProduct {
    return {
      id: item.id,
      category: item.category,
      brand: item.brand,
      name: item.name,
      rating: item.rating,
      reviewCount: item.reviewCount,
      price: item.price,
      originalPrice: item.originalPrice ?? undefined,
      badge: item.badge ?? undefined,
      imageUrl: item.imageUrl ?? undefined,
    };
  }

  async getSaleProducts(input?: SaleProductsInput): Promise<SaleProduct[]> {
    const category = input?.category?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const sidebarGroups = new Set([
      'clubs',
      'balls',
      'bags',
      'apparel',
      'accessories',
    ]);

    let catalogRows = await this.loadSaleCatalogProducts();

    if (category && category !== 'all') {
      if (sidebarGroups.has(category)) {
        catalogRows = catalogRows.filter(
          (item) =>
            this.resolveSaleGroupLabel(item).toLowerCase() === category,
        );
      } else {
        catalogRows = catalogRows.filter(
          (item) => item.category.toLowerCase() === category,
        );
      }
    }

    const catalogProducts = catalogRows.map((item) =>
      this.mapCatalogToSaleProduct(item),
    );
    let products = [...catalogProducts];

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category} ${product.saleGroup}`
          .toLowerCase()
          .includes(search),
      );
    }

    const sort = input?.sort ?? SaleSort.DISCOUNT_DESC;
    products.sort((a, b) => {
      if (sort === SaleSort.PRICE_ASC) {
        return a.salePrice - b.salePrice;
      }
      if (sort === SaleSort.PRICE_DESC) {
        return b.salePrice - a.salePrice;
      }
      if (sort === SaleSort.RATING_DESC) {
        return b.rating - a.rating;
      }

      const aDiscount = (a.originalPrice - a.salePrice) / a.originalPrice;
      const bDiscount = (b.originalPrice - b.salePrice) / b.originalPrice;
      return bDiscount - aDiscount;
    });

    return products;
  }

  async getClubProducts(input?: ClubProductsInput): Promise<ClubProductsResult> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 9;
    const category = input?.category?.trim().toLowerCase();
    const brand = input?.brand?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const priceRange = input?.priceRange ?? ClubPriceRange.ALL;
    const sort = input?.sort ?? ClubSort.FEATURED;

    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.CLUBS)
    ).map((item) => this.mapCatalogToClubProduct(item));
    let products = [...catalogProducts];

    if (category && category !== 'all') {
      products = products.filter(
        (product) => product.category.toLowerCase() === category,
      );
    }

    if (brand && brand !== 'all') {
      products = products.filter((product) => product.brand.toLowerCase() === brand);
    }

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      );
    }

    if (priceRange !== ClubPriceRange.ALL) {
      products = products.filter((product) => {
        if (priceRange === ClubPriceRange.UNDER_50) return product.price < 50;
        if (priceRange === ClubPriceRange.RANGE_50_100)
          return product.price >= 50 && product.price <= 100;
        if (priceRange === ClubPriceRange.RANGE_100_250)
          return product.price > 100 && product.price <= 250;
        if (priceRange === ClubPriceRange.RANGE_250_500)
          return product.price > 250 && product.price <= 500;
        return product.price > 500;
      });
    }

    products.sort((a, b) => {
      if (sort === ClubSort.PRICE_ASC) return a.price - b.price;
      if (sort === ClubSort.PRICE_DESC) return b.price - a.price;
      if (sort === ClubSort.RATING_DESC) return b.rating - a.rating;

      const score = (product: ClubProduct) => {
        if (product.badge === 'Best Seller') return 4;
        if (product.badge === 'New') return 3;
        if (product.badge === 'Popular') return 2;
        if (product.badge === 'Sale') return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async getFeaturedProducts(limit = 8): Promise<ClubProduct[]> {
    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.CLUBS)
    ).map((item) => this.mapCatalogToClubProduct(item));
    return [...catalogProducts]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  async getBallProducts(input?: BallProductsInput): Promise<BallProductsResult> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 9;
    const category = input?.category?.trim().toLowerCase();
    const brand = input?.brand?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const priceRange = input?.priceRange ?? BallPriceRange.ALL;
    const sort = input?.sort ?? BallSort.FEATURED;

    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.BALLS)
    ).map((item) => this.mapCatalogToBallProduct(item));
    let products = [...catalogProducts];

    if (category && category !== 'all') {
      products = products.filter(
        (product) => product.category.toLowerCase() === category,
      );
    }

    if (brand && brand !== 'all') {
      products = products.filter((product) => product.brand.toLowerCase() === brand);
    }

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      );
    }

    if (priceRange !== BallPriceRange.ALL) {
      products = products.filter((product) => {
        if (priceRange === BallPriceRange.UNDER_50) return product.price < 50;
        if (priceRange === BallPriceRange.RANGE_50_100)
          return product.price >= 50 && product.price <= 100;
        if (priceRange === BallPriceRange.RANGE_100_250)
          return product.price > 100 && product.price <= 250;
        if (priceRange === BallPriceRange.RANGE_250_500)
          return product.price > 250 && product.price <= 500;
        return product.price > 500;
      });
    }

    products.sort((a, b) => {
      if (sort === BallSort.PRICE_ASC) return a.price - b.price;
      if (sort === BallSort.PRICE_DESC) return b.price - a.price;
      if (sort === BallSort.RATING_DESC) return b.rating - a.rating;

      const score = (product: BallProduct) => {
        if (product.badge === 'Best Seller') return 5;
        if (product.badge === 'Popular') return 4;
        if (product.badge === 'New') return 3;
        if (product.badge === 'Sale') return 2;
        if (product.badge === 'Best Value') return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async getBagProducts(input?: BagProductsInput): Promise<BagProductsResult> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 9;
    const category = input?.category?.trim().toLowerCase();
    const brand = input?.brand?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const priceRange = input?.priceRange ?? BagPriceRange.ALL;
    const sort = input?.sort ?? BagSort.FEATURED;

    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.BAGS)
    ).map((item) => this.mapCatalogToBagProduct(item));
    let products = [...catalogProducts];

    if (category && category !== 'all') {
      products = products.filter(
        (product) => product.category.toLowerCase() === category,
      );
    }

    if (brand && brand !== 'all') {
      products = products.filter((product) => product.brand.toLowerCase() === brand);
    }

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      );
    }

    if (priceRange !== BagPriceRange.ALL) {
      products = products.filter((product) => {
        if (priceRange === BagPriceRange.UNDER_50) return product.price < 50;
        if (priceRange === BagPriceRange.RANGE_50_100)
          return product.price >= 50 && product.price <= 100;
        if (priceRange === BagPriceRange.RANGE_100_250)
          return product.price > 100 && product.price <= 250;
        if (priceRange === BagPriceRange.RANGE_250_500)
          return product.price > 250 && product.price <= 500;
        return product.price > 500;
      });
    }

    products.sort((a, b) => {
      if (sort === BagSort.PRICE_ASC) return a.price - b.price;
      if (sort === BagSort.PRICE_DESC) return b.price - a.price;
      if (sort === BagSort.RATING_DESC) return b.rating - a.rating;

      const score = (product: BagProduct) => {
        if (product.badge === 'Best Seller') return 5;
        if (product.badge === 'Popular') return 4;
        if (product.badge === 'New') return 3;
        if (product.badge === 'Sale') return 2;
        if (product.badge === 'Premium') return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async getApparelProducts(
    input?: ApparelProductsInput,
  ): Promise<ApparelProductsResult> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 9;
    const category = input?.category?.trim().toLowerCase();
    const brand = input?.brand?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const priceRange = input?.priceRange ?? ApparelPriceRange.ALL;
    const sort = input?.sort ?? ApparelSort.FEATURED;

    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.APPAREL)
    ).map((item) => this.mapCatalogToApparelProduct(item));
    let products = [...catalogProducts];

    if (category && category !== 'all') {
      products = products.filter(
        (product) => product.category.toLowerCase() === category,
      );
    }

    if (brand && brand !== 'all') {
      products = products.filter((product) => product.brand.toLowerCase() === brand);
    }

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      );
    }

    if (priceRange !== ApparelPriceRange.ALL) {
      products = products.filter((product) => {
        if (priceRange === ApparelPriceRange.UNDER_50) return product.price < 50;
        if (priceRange === ApparelPriceRange.RANGE_50_100)
          return product.price >= 50 && product.price <= 100;
        if (priceRange === ApparelPriceRange.RANGE_100_250)
          return product.price > 100 && product.price <= 250;
        if (priceRange === ApparelPriceRange.RANGE_250_500)
          return product.price > 250 && product.price <= 500;
        return product.price > 500;
      });
    }

    products.sort((a, b) => {
      if (sort === ApparelSort.PRICE_ASC) return a.price - b.price;
      if (sort === ApparelSort.PRICE_DESC) return b.price - a.price;
      if (sort === ApparelSort.RATING_DESC) return b.rating - a.rating;

      const score = (product: ApparelProduct) => {
        if (product.badge === 'Best Seller') return 6;
        if (product.badge === 'Popular') return 5;
        if (product.badge === 'New') return 4;
        if (product.badge === 'Sale') return 3;
        if (product.badge === 'Premium') return 2;
        if (product.badge === 'Best Value') return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async getAccessoryProducts(
    input?: AccessoryProductsInput,
  ): Promise<AccessoryProductsResult> {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 9;
    const category = input?.category?.trim().toLowerCase();
    const brand = input?.brand?.trim().toLowerCase();
    const search = input?.search?.trim().toLowerCase();
    const priceRange = input?.priceRange ?? AccessoryPriceRange.ALL;
    const sort = input?.sort ?? AccessorySort.FEATURED;

    const catalogProducts = (
      await this.loadCatalogBySource(CatalogProductSource.ACCESSORIES)
    ).map((item) => this.mapCatalogToAccessoryProduct(item));
    let products = [...catalogProducts];

    if (category && category !== 'all') {
      products = products.filter(
        (product) => product.category.toLowerCase() === category,
      );
    }

    if (brand && brand !== 'all') {
      products = products.filter((product) => product.brand.toLowerCase() === brand);
    }

    if (search) {
      products = products.filter((product) =>
        `${product.name} ${product.brand} ${product.category}`
          .toLowerCase()
          .includes(search),
      );
    }

    if (priceRange !== AccessoryPriceRange.ALL) {
      products = products.filter((product) => {
        if (priceRange === AccessoryPriceRange.UNDER_50) return product.price < 50;
        if (priceRange === AccessoryPriceRange.RANGE_50_100)
          return product.price >= 50 && product.price <= 100;
        if (priceRange === AccessoryPriceRange.RANGE_100_250)
          return product.price > 100 && product.price <= 250;
        if (priceRange === AccessoryPriceRange.RANGE_250_500)
          return product.price > 250 && product.price <= 500;
        return product.price > 500;
      });
    }

    products.sort((a, b) => {
      if (sort === AccessorySort.PRICE_ASC) return a.price - b.price;
      if (sort === AccessorySort.PRICE_DESC) return b.price - a.price;
      if (sort === AccessorySort.RATING_DESC) return b.rating - a.rating;

      const score = (product: AccessoryProduct) => {
        if (product.badge === 'Best Seller') return 5;
        if (product.badge === 'Popular') return 4;
        if (product.badge === 'New') return 3;
        if (product.badge === 'Sale') return 2;
        if (product.badge === 'Premium') return 1;
        return 0;
      };
      return score(b) - score(a);
    });

    const start = (page - 1) * limit;
    return {
      items: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async getBrandCount(): Promise<number> {
    if (!this.catalogRepository) return 0;
    const all = await this.catalogRepository.find({ where: { isActive: true } });
    const brands = new Set(all.map((p) => p.brand.trim().toLowerCase()));
    return brands.size;
  }

  async getProductById(id: string): Promise<ProductDetail | null> {
    const productId = id.trim();
    if (!productId) return null;

    const toDescription = (brand: string, name: string, category: string) =>
      `${brand} ${name} is a premium ${category.toLowerCase()} option designed for performance, consistency, and confidence on the course.`;

    const dbProduct = this.catalogRepository
      ? await this.catalogRepository.findOne({ where: { id: productId, isActive: true } })
      : null;
    if (dbProduct) {
      return {
        id: dbProduct.id,
        source: dbProduct.source,
        category: dbProduct.category,
        brand: dbProduct.brand,
        name: dbProduct.name,
        rating: dbProduct.rating,
        reviewCount: dbProduct.reviewCount,
        price: dbProduct.salePrice ?? dbProduct.price,
        originalPrice: dbProduct.originalPrice ?? undefined,
        badge: dbProduct.badge ?? undefined,
        imageUrl: dbProduct.imageUrl ?? undefined,
        description:
          dbProduct.description ??
          toDescription(dbProduct.brand, dbProduct.name, dbProduct.category),
      };
    }

    return null;
  }
}

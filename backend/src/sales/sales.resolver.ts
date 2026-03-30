import { Args, Query, Resolver } from '@nestjs/graphql';
import { SaleProductsInput } from './dto/sale-products.input';
import { SaleProduct } from './models/sale-product.model';
import { SalesService } from './sales.service';
import { ClubProductsInput } from './dto/club-products.input';
import { ClubProduct, ClubProductsResult } from './models/club-product.model';
import { BallProductsInput } from './dto/ball-products.input';
import { BallProductsResult } from './models/ball-product.model';
import { BagProductsInput } from './dto/bag-products.input';
import { BagProductsResult } from './models/bag-product.model';
import { ApparelProductsInput } from './dto/apparel-products.input';
import { ApparelProductsResult } from './models/apparel-product.model';
import { AccessoryProductsInput } from './dto/accessory-products.input';
import { AccessoryProductsResult } from './models/accessory-product.model';
import { ProductDetail } from './models/product-detail.model';

@Resolver()
export class SalesResolver {
  constructor(private readonly salesService: SalesService) {}

  @Query(() => [SaleProduct])
  saleProducts(
    @Args('input', { nullable: true }) input?: SaleProductsInput,
  ): Promise<SaleProduct[]> {
    return this.salesService.getSaleProducts(input);
  }

  @Query(() => ClubProductsResult)
  clubProducts(
    @Args('input', { nullable: true }) input?: ClubProductsInput,
  ): Promise<ClubProductsResult> {
    return this.salesService.getClubProducts(input);
  }

  @Query(() => [ClubProduct])
  featuredProducts(
    @Args('limit', { nullable: true }) limit?: number,
  ): Promise<ClubProduct[]> {
    return this.salesService.getFeaturedProducts(limit ?? 8);
  }

  @Query(() => BallProductsResult)
  ballProducts(
    @Args('input', { nullable: true }) input?: BallProductsInput,
  ): Promise<BallProductsResult> {
    return this.salesService.getBallProducts(input);
  }

  @Query(() => BagProductsResult)
  bagProducts(
    @Args('input', { nullable: true }) input?: BagProductsInput,
  ): Promise<BagProductsResult> {
    return this.salesService.getBagProducts(input);
  }

  @Query(() => ApparelProductsResult)
  apparelProducts(
    @Args('input', { nullable: true }) input?: ApparelProductsInput,
  ): Promise<ApparelProductsResult> {
    return this.salesService.getApparelProducts(input);
  }

  @Query(() => AccessoryProductsResult)
  accessoryProducts(
    @Args('input', { nullable: true }) input?: AccessoryProductsInput,
  ): Promise<AccessoryProductsResult> {
    return this.salesService.getAccessoryProducts(input);
  }

  @Query(() => ProductDetail, { nullable: true })
  productById(@Args('id') id: string): Promise<ProductDetail | null> {
    return this.salesService.getProductById(id);
  }

  @Query(() => Number)
  brandCount(): Promise<number> {
    return this.salesService.getBrandCount();
  }
}

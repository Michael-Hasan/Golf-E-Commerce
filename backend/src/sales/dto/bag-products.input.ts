import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum BagSort {
  FEATURED = 'FEATURED',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

export enum BagPriceRange {
  ALL = 'ALL',
  UNDER_50 = 'UNDER_50',
  RANGE_50_100 = 'RANGE_50_100',
  RANGE_100_250 = 'RANGE_100_250',
  RANGE_250_500 = 'RANGE_250_500',
  OVER_500 = 'OVER_500',
}

registerEnumType(BagSort, { name: 'BagSort' });
registerEnumType(BagPriceRange, { name: 'BagPriceRange' });

@InputType()
export class BagProductsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  brand?: string;

  @Field(() => BagPriceRange, { nullable: true })
  @IsOptional()
  @IsEnum(BagPriceRange)
  priceRange?: BagPriceRange;

  @Field(() => BagSort, { nullable: true })
  @IsOptional()
  @IsEnum(BagSort)
  sort?: BagSort;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

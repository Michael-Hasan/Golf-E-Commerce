import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AccessorySort {
  FEATURED = 'FEATURED',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

export enum AccessoryPriceRange {
  ALL = 'ALL',
  UNDER_50 = 'UNDER_50',
  RANGE_50_100 = 'RANGE_50_100',
  RANGE_100_250 = 'RANGE_100_250',
  RANGE_250_500 = 'RANGE_250_500',
  OVER_500 = 'OVER_500',
}

registerEnumType(AccessorySort, { name: 'AccessorySort' });
registerEnumType(AccessoryPriceRange, { name: 'AccessoryPriceRange' });

@InputType()
export class AccessoryProductsInput {
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

  @Field(() => AccessoryPriceRange, { nullable: true })
  @IsOptional()
  @IsEnum(AccessoryPriceRange)
  priceRange?: AccessoryPriceRange;

  @Field(() => AccessorySort, { nullable: true })
  @IsOptional()
  @IsEnum(AccessorySort)
  sort?: AccessorySort;

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

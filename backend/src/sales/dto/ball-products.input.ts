import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum BallSort {
  FEATURED = 'FEATURED',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

export enum BallPriceRange {
  ALL = 'ALL',
  UNDER_50 = 'UNDER_50',
  RANGE_50_100 = 'RANGE_50_100',
  RANGE_100_250 = 'RANGE_100_250',
  RANGE_250_500 = 'RANGE_250_500',
  OVER_500 = 'OVER_500',
}

registerEnumType(BallSort, { name: 'BallSort' });
registerEnumType(BallPriceRange, { name: 'BallPriceRange' });

@InputType()
export class BallProductsInput {
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

  @Field(() => BallPriceRange, { nullable: true })
  @IsOptional()
  @IsEnum(BallPriceRange)
  priceRange?: BallPriceRange;

  @Field(() => BallSort, { nullable: true })
  @IsOptional()
  @IsEnum(BallSort)
  sort?: BallSort;

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

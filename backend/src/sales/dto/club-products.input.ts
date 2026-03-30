import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ClubSort {
  FEATURED = 'FEATURED',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

export enum ClubPriceRange {
  ALL = 'ALL',
  UNDER_50 = 'UNDER_50',
  RANGE_50_100 = 'RANGE_50_100',
  RANGE_100_250 = 'RANGE_100_250',
  RANGE_250_500 = 'RANGE_250_500',
  OVER_500 = 'OVER_500',
}

registerEnumType(ClubSort, { name: 'ClubSort' });
registerEnumType(ClubPriceRange, { name: 'ClubPriceRange' });

@InputType()
export class ClubProductsInput {
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

  @Field(() => ClubPriceRange, { nullable: true })
  @IsOptional()
  @IsEnum(ClubPriceRange)
  priceRange?: ClubPriceRange;

  @Field(() => ClubSort, { nullable: true })
  @IsOptional()
  @IsEnum(ClubSort)
  sort?: ClubSort;

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

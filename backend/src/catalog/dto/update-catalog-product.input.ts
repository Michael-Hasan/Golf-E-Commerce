import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { CatalogProductSource } from '../catalog-product-source.enum';

@InputType()
export class UpdateCatalogProductInput {
  @Field(() => CatalogProductSource, { nullable: true })
  @IsOptional()
  @IsEnum(CatalogProductSource)
  source?: CatalogProductSource;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  brand?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reviewCount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  badge?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsUrl({
    require_protocol: true,
    protocols: ['http', 'https'],
  })
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

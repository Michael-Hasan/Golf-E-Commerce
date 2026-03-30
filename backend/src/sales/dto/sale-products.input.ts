import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SaleSort {
  DISCOUNT_DESC = 'DISCOUNT_DESC',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

registerEnumType(SaleSort, { name: 'SaleSort' });

@InputType()
export class SaleProductsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => SaleSort, { nullable: true })
  @IsOptional()
  @IsEnum(SaleSort)
  sort?: SaleSort;
}

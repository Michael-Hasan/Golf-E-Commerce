import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class PlaceOrderItemInput {
  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(1)
  brand: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(1)
  name: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  unitPrice: number;
}

@InputType()
export class PlaceOrderInput {
  @Field()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  contactEmail: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  contactPhone: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  deliveryName: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  deliveryAddressLine1: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  @MaxLength(140)
  deliveryAddressLine2?: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  deliveryCity: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  deliveryRegion: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  deliveryPostalCode: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  deliveryCountry: string;

  @Field()
  @IsString()
  @IsIn(['STANDARD', 'EXPRESS'])
  shippingMethod: 'STANDARD' | 'EXPRESS';

  @Field()
  @IsString()
  @IsIn(['CARD', 'PAYPAL', 'BANK_TRANSFER'])
  paymentMethod: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER';

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  cardHolderName: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(3)
  @MaxLength(25)
  cardNumberMasked: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(3)
  @MaxLength(7)
  cardExpiry: string;

  @Field(() => [PlaceOrderItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaceOrderItemInput)
  items: PlaceOrderItemInput[];
}

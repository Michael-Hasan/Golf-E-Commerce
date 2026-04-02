import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SupportOrderLookupInput {
  @Field()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  orderNumber: string;

  @Field()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(254)
  email: string;
}

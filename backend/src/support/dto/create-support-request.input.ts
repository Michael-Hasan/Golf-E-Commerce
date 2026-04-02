import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateSupportRequestInput {
  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Field()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim().toUpperCase()))
  @IsString()
  @MaxLength(40)
  orderNumber?: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}

import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class FindCheckoutOrderInput {
  @Field()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  orderNumber: string;
}

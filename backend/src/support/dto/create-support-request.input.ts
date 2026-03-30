import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateSupportRequestInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  topic: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  orderNumber?: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}

import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

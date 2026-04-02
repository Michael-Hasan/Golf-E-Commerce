import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Field()
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @Matches(/^\+?[0-9()\-\s]{7,30}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

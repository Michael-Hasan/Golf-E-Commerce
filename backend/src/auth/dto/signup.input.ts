import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, MinLength, IsString } from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  phone: string;

  @Field()
  @MinLength(6)
  password: string;
}


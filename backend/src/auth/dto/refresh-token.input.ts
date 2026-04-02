import { Field, InputType } from '@nestjs/graphql';
import { IsJWT, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  @IsJWT()
  refreshToken: string;
}

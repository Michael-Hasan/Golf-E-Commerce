import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationInput } from '../../shared/dto/pagination.input';

@InputType()
export class SupportFaqsQueryInput extends PaginationInput {
  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim().toLowerCase()))
  @IsString()
  @MaxLength(10)
  locale?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  @MaxLength(80)
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  featuredOnly?: boolean;
}

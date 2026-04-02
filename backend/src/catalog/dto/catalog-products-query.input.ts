import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationInput } from '../../shared/dto/pagination.input';

@InputType()
export class CatalogProductsQueryInput extends PaginationInput {
  @Field(() => Boolean, { defaultValue: true })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  includeInactive? = true;
}

import { InputType } from '@nestjs/graphql';
import { PaginationInput } from '../../shared/dto/pagination.input';

@InputType()
export class MyOrdersQueryInput extends PaginationInput {}

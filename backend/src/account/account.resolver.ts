import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { User } from '../users/user.entity';
import { AccountService } from './account.service';
import { MyOrdersQueryInput } from './dto/my-orders-query.input';
import { PaginatedMyOrders } from './entities/paginated-my-orders.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { MyPageData } from './entities/my-page.entity';

@Resolver()
@UseGuards(GqlAuthGuard)
export class AccountResolver {
  constructor(private readonly accountService: AccountService) {}

  @Query(() => MyPageData)
  myPage(@CurrentUser() user: User): Promise<MyPageData> {
    return this.accountService.getMyPageData(user);
  }

  @Query(() => PaginatedMyOrders)
  myOrders(
    @CurrentUser() user: User,
    @Args('input', { nullable: true }) input?: MyOrdersQueryInput,
  ): Promise<PaginatedMyOrders> {
    return this.accountService.getMyOrders(user, input ?? new MyOrdersQueryInput());
  }

  @Mutation(() => MyPageData)
  updateMyProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<MyPageData> {
    return this.accountService.updateMyProfile(user, input);
  }
}

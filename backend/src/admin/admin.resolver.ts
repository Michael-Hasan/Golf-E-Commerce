import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserRole } from '../users/user-role.enum';

@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class AdminResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  adminUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Mutation(() => User)
  adminUpdateUserRole(
    @Args('userId') userId: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
  ): Promise<User> {
    return this.usersService.updateRole(userId, role);
  }
}

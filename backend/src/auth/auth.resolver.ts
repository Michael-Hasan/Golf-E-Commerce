import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './models/auth-payload.model';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { User } from '../users/user.entity';
import { MyPageData } from './models/my-page.model';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateProfileInput } from './dto/update-profile.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async signup(@Args('input') input: SignupInput): Promise<AuthPayload> {
    const { user, accessToken } = await this.authService.signup(
      input.email,
      input.phone,
      input.password,
    );
    return { user, accessToken };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const { user, accessToken } = await this.authService.login(
      input.email,
      input.password,
    );
    return { user, accessToken };
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: User): User {
    return this.authService.getCurrentUser(user);
  }

  @Query(() => MyPageData)
  @UseGuards(GqlAuthGuard)
  myPage(@CurrentUser() user: User): Promise<MyPageData> {
    return this.authService.getMyPageData(user);
  }

  @Mutation(() => MyPageData)
  @UseGuards(GqlAuthGuard)
  updateMyProfile(
    @CurrentUser() user: User,
    @Args('input') input: UpdateProfileInput,
  ): Promise<MyPageData> {
    return this.authService.updateMyProfile(user, input);
  }
}


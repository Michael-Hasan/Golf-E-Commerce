import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { AuthPayload } from './models/auth-payload.model';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { User } from '../users/user.entity';
import { CurrentUser } from './decorators/current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async signup(@Args('input') input: SignupInput): Promise<AuthPayload> {
    const { user, accessToken, refreshToken } = await this.authService.signup(
      input.email,
      input.phone,
      input.password,
    );
    return { user, accessToken, refreshToken };
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    const { user, accessToken, refreshToken } = await this.authService.login(
      input.email,
      input.password,
    );
    return { user, accessToken, refreshToken };
  }

  @Mutation(() => AuthPayload)
  async refresh(@Args('input') input: RefreshTokenInput): Promise<AuthPayload> {
    const { user, accessToken, refreshToken } =
      await this.authService.refreshTokens(input);
    return { user, accessToken, refreshToken };
  }

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  me(@CurrentUser() user: User): User {
    return this.authService.getCurrentUser(user);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  logout(@CurrentUser() user: User): Promise<boolean> {
    return this.authService.logout(user.id);
  }
}

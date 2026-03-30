import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { UsersRootModule } from "../users/users-root.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GqlAuthGuard } from "./guards/gql-auth.guard";
import { AdminGuard } from "./guards/admin.guard";
import { CheckoutModule } from "../checkout/checkout.module";

@Module({
  imports: [
    UsersRootModule.forRoot({
      useInMemory: process.env.USE_IN_MEMORY_DB !== "0",
    }),
    CheckoutModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "super-secret-jwt-key",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, GqlAuthGuard, AdminGuard],
  exports: [GqlAuthGuard, AdminGuard],
})
export class AuthModule {}

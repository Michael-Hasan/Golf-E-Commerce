import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { validateEnv } from './config/env.validation';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { AppResolver } from './app.resolver';
import { SalesModule } from './sales/sales.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { SupportModule } from './support/support.module';
import { AppLogger } from './logging/logger.service';
import { LoggingModule } from './logging/logging.module';
import { RequestLoggingMiddleware } from './logging/request-logging.middleware';
import { AppCacheService } from './shared/cache/app-cache.service';
import { CacheModule } from './shared/cache/cache.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { RateLimitMiddleware } from './security/rate-limit.middleware';
import {
  createComplexityLimitRule,
  createDepthLimitRule,
} from './shared/graphql/validation-rules';

// Use in-memory DB by default so app starts without PostgreSQL. Set USE_IN_MEMORY_DB=0 to use PostgreSQL.
const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';
const graphQlDepthLimit = parseInt(process.env.GRAPHQL_MAX_DEPTH ?? '8', 10);
const graphQlComplexityLimit = parseInt(
  process.env.GRAPHQL_MAX_COMPLEXITY ?? '150',
  10,
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', `.env.${process.env.NODE_ENV ?? 'development'}`),
        join(__dirname, '..', '.env'),
      ],
      validate: validateEnv,
    }),
    ...(useInMemoryDb
      ? []
      : [
          TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              type: 'postgres',
              host: config.get('DB_HOST', 'localhost'),
              port: parseInt(config.get('DB_PORT', '5432'), 10),
              username: config.get('DB_USERNAME', 'postgres'),
              password: config.get('DB_PASSWORD', 'postgres'),
              database: config.get('DB_DATABASE', 'golf_ecommerce'),
              synchronize: false,
              migrationsRun: config.get('DB_RUN_MIGRATIONS', '1') === '1',
              migrations: [join(__dirname, 'database', 'migrations', '*.js')],
              autoLoadEntities: true,
            }),
          }),
        ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      sortSchema: true,
      context: ({ req }) => ({ req }),
      validationRules: [
        createDepthLimitRule(graphQlDepthLimit),
        createComplexityLimitRule(graphQlComplexityLimit),
      ],
    }),
    LoggingModule,
    CacheModule,
    AccountModule,
    AuthModule,
    HealthModule,
    JobsModule,
    MonitoringModule,
    SalesModule,
    AdminModule,
    CatalogModule,
    CheckoutModule,
    SupportModule,
    ChatModule,
    AiModule,
  ],
  providers: [
    AppResolver,
    RequestLoggingMiddleware,
    RateLimitMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RateLimitMiddleware, RequestLoggingMiddleware).forRoutes('*');
  }
}

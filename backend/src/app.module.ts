import { Module } from '@nestjs/common';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './auth/auth.module';
import { AppResolver } from './app.resolver';
import { SalesModule } from './sales/sales.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { CheckoutModule } from './checkout/checkout.module';
import { SupportModule } from './support/support.module';

// Use in-memory DB by default so app starts without PostgreSQL. Set USE_IN_MEMORY_DB=0 to use PostgreSQL.
const useInMemoryDb = process.env.USE_IN_MEMORY_DB !== '0';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
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
              autoLoadEntities: true,
              synchronize: true,
            }),
          }),
        ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    AuthModule,
    SalesModule,
    AdminModule,
    CatalogModule,
    CheckoutModule,
    SupportModule,
    ChatModule,
    AiModule,
  ],
  providers: [AppResolver],
})
export class AppModule {}

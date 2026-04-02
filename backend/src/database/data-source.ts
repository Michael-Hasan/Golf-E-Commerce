import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { validateEnv } from '../config/env.validation';
import { User } from '../users/user.entity';
import { CatalogProduct } from '../catalog/catalog-product.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { Order } from '../checkout/entities/order.entity';

const backendEnv = resolve(__dirname, '..', '..', '.env');
const envByNodeEnv = resolve(
  __dirname,
  '..',
  '..',
  `.env.${process.env.NODE_ENV ?? 'development'}`,
);

if (existsSync(backendEnv)) {
  loadEnv({ path: backendEnv });
}
if (existsSync(envByNodeEnv)) {
  loadEnv({ path: envByNodeEnv, override: true });
}

validateEnv(process.env);

export const appDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'golf_ecommerce',
  synchronize: false,
  logging: false,
  entities: [User, CatalogProduct, SupportTicket, Order],
  migrations: [join(__dirname, 'migrations', '*.js')],
});

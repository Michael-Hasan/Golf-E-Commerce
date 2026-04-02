import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          CREATE TYPE users_role_enum AS ENUM ('CUSTOMER', 'ADMIN');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'catalog_products_source_enum') THEN
          CREATE TYPE catalog_products_source_enum AS ENUM ('CLUBS', 'BALLS', 'BAGS', 'APPAREL', 'ACCESSORIES', 'SALE');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar NOT NULL UNIQUE,
        phone varchar NOT NULL,
        first_name varchar NULL,
        last_name varchar NULL,
        password_hash varchar NOT NULL,
        refresh_token_hash varchar NULL,
        role users_role_enum NOT NULL DEFAULT 'CUSTOMER',
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS catalog_products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source catalog_products_source_enum NOT NULL,
        category varchar NOT NULL,
        brand varchar NOT NULL,
        name varchar NOT NULL,
        rating double precision NOT NULL DEFAULT 0,
        review_count integer NOT NULL DEFAULT 0,
        price double precision NOT NULL,
        original_price double precision NULL,
        sale_price double precision NULL,
        badge varchar NULL,
        image_url varchar NULL,
        description text NULL,
        is_featured boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON catalog_products (category);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_catalog_products_source_active_created ON catalog_products (source, is_active, created_at);`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reference_number varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        email varchar NOT NULL,
        topic varchar NOT NULL,
        order_number varchar NULL,
        message text NOT NULL,
        status varchar NOT NULL DEFAULT 'OPEN',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_support_tickets_email_created ON support_tickets (email, created_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_support_tickets_order_number ON support_tickets (order_number);`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number varchar NOT NULL UNIQUE,
        user_id varchar NULL,
        subtotal double precision NOT NULL,
        shipping_cost double precision NOT NULL,
        tax double precision NOT NULL,
        total double precision NOT NULL,
        currency varchar NOT NULL,
        payment_method varchar NOT NULL,
        shipping_method varchar NOT NULL,
        contact_email varchar NOT NULL,
        contact_phone varchar NOT NULL,
        delivery_name varchar NOT NULL,
        delivery_address_line1 varchar NOT NULL,
        delivery_address_line2 varchar NULL,
        delivery_city varchar NOT NULL,
        delivery_region varchar NOT NULL,
        delivery_postal_code varchar NOT NULL,
        delivery_country varchar NOT NULL,
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_contact_email ON orders (contact_email);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS orders;`);
    await queryRunner.query(`DROP TABLE IF EXISTS support_tickets;`);
    await queryRunner.query(`DROP TABLE IF EXISTS catalog_products;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
    await queryRunner.query(`DROP TYPE IF EXISTS catalog_products_source_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS users_role_enum;`);
  }
}

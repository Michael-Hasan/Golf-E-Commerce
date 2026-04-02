import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CatalogProductSource } from './catalog-product-source.enum';

@Entity('catalog_products')
@Index('idx_catalog_products_category', ['category'])
@Index('idx_catalog_products_source_active_created', ['source', 'isActive', 'createdAt'])
@ObjectType()
export class CatalogProduct {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({
    type: 'enum',
    enum: CatalogProductSource,
  })
  @Field(() => CatalogProductSource)
  source: CatalogProductSource;

  @Column({ type: 'varchar' })
  @Field()
  category: string;

  @Column({ type: 'varchar' })
  @Field()
  brand: string;

  @Column({ type: 'varchar' })
  @Field()
  name: string;

  @Column({ type: 'float', default: 0 })
  @Field(() => Float)
  rating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  @Field(() => Int)
  reviewCount: number;

  @Column({ type: 'float' })
  @Field(() => Float)
  price: number;

  @Column({ name: 'original_price', type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  originalPrice?: number | null;

  @Column({ name: 'sale_price', type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  badge?: string | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  @Field()
  isFeatured: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Field()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt: Date;
}

import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CatalogProductSource } from './catalog-product-source.enum';

@Entity('catalog_products')
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

  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  reviewCount: number;

  @Column({ type: 'float' })
  @Field(() => Float)
  price: number;

  @Column({ type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  originalPrice?: number | null;

  @Column({ type: 'float', nullable: true })
  @Field(() => Float, { nullable: true })
  salePrice?: number | null;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  badge?: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  @Field(() => String, { nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: false })
  @Field()
  isFeatured: boolean;

  @Column({ type: 'boolean', default: true })
  @Field()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt: Date;
}

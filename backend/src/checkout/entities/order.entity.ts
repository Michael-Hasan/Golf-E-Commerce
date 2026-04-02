import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
export class OrderLineItem {
  @Field()
  id: string;

  @Field()
  brand: string;

  @Field()
  name: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  lineTotal: number;
}

@Entity('orders')
@Index('idx_orders_order_number', ['orderNumber'])
@Index('idx_orders_user_id', ['userId'])
@Index('idx_orders_created_at', ['createdAt'])
@Index('idx_orders_contact_email', ['contactEmail'])
@ObjectType()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'varchar', unique: true, name: 'order_number' })
  @Field()
  orderNumber: string;

  @Column({ type: 'varchar', name: 'user_id', nullable: true })
  @Field(() => String, { nullable: true })
  userId?: string | null;

  @Column({ type: 'float' })
  @Field(() => Float)
  subtotal: number;

  @Column({ type: 'float', name: 'shipping_cost' })
  @Field(() => Float)
  shippingCost: number;

  @Column({ type: 'float' })
  @Field(() => Float)
  tax: number;

  @Column({ type: 'float' })
  @Field(() => Float)
  total: number;

  @Column({ type: 'varchar' })
  @Field()
  currency: string;

  @Column({ type: 'varchar', name: 'payment_method' })
  @Field()
  paymentMethod: string;

  @Column({ type: 'varchar', name: 'shipping_method' })
  @Field()
  shippingMethod: string;

  @Column({ type: 'varchar', name: 'contact_email' })
  @Field()
  contactEmail: string;

  @Column({ type: 'varchar', name: 'contact_phone' })
  @Field()
  contactPhone: string;

  @Column({ type: 'varchar', name: 'delivery_name' })
  @Field()
  deliveryName: string;

  @Column({ type: 'varchar', name: 'delivery_address_line1' })
  @Field()
  deliveryAddressLine1: string;

  @Column({ type: 'varchar', name: 'delivery_address_line2', nullable: true })
  @Field({ nullable: true })
  deliveryAddressLine2?: string;

  @Column({ type: 'varchar', name: 'delivery_city' })
  @Field()
  deliveryCity: string;

  @Column({ type: 'varchar', name: 'delivery_region' })
  @Field()
  deliveryRegion: string;

  @Column({ type: 'varchar', name: 'delivery_postal_code' })
  @Field()
  deliveryPostalCode: string;

  @Column({ type: 'varchar', name: 'delivery_country' })
  @Field()
  deliveryCountry: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  @Field(() => [OrderLineItem])
  items: OrderLineItem[];

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @Field()
  placedAtIso: string;
}

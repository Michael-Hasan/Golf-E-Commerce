import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('support_tickets')
@ObjectType()
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ type: 'varchar', unique: true })
  @Field()
  referenceNumber: string;

  @Column({ type: 'varchar' })
  @Field()
  name: string;

  @Column({ type: 'varchar' })
  @Field()
  email: string;

  @Column({ type: 'varchar' })
  @Field()
  topic: string;

  @Column({ type: 'varchar', nullable: true })
  @Field(() => String, { nullable: true })
  orderNumber?: string | null;

  @Column({ type: 'text' })
  @Field()
  message: string;

  @Column({ type: 'varchar', default: 'OPEN' })
  @Field()
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt: Date;
}

import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
@Index('idx_users_email', ['email'])
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column({ unique: true })
  @Field()
  email: string;

  @Column()
  @Field()
  phone: string;

  @Column({ type: 'varchar', name: 'first_name', nullable: true })
  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', name: 'last_name', nullable: true })
  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', name: 'refresh_token_hash', nullable: true })
  refreshTokenHash?: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @Field(() => UserRole)
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

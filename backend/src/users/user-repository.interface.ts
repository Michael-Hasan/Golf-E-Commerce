import { User } from './user.entity';
import { UserRole } from './user-role.enum';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(
    email: string,
    phone: string,
    passwordHash: string,
    role?: UserRole,
  ): Promise<User>;
  updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User>;
  updateRole(userId: string, role: UserRole): Promise<User>;
}

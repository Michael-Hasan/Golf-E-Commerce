import { Injectable, Inject } from '@nestjs/common';
import { User } from './user.entity';
import { USER_REPOSITORY, IUserRepository } from './user-repository.interface';
import { UserRole } from './user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async create(
    email: string,
    phone: string,
    passwordHash: string,
    role?: UserRole,
  ): Promise<User> {
    return this.userRepository.create(email, phone, passwordHash, role);
  }

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User> {
    return this.userRepository.updateProfile(userId, input);
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    return this.userRepository.updateRole(userId, role);
  }
}


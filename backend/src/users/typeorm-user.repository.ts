import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { IUserRepository } from './user-repository.interface';
import { UserRole } from './user-role.enum';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(
    email: string,
    phone: string,
    passwordHash: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }
    const user = this.repo.create({
      email,
      phone,
      passwordHash,
      refreshTokenHash: null,
      role,
    });
    return this.repo.save(user);
  }

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (typeof input.firstName === 'string') {
      user.firstName = input.firstName;
    }
    if (typeof input.lastName === 'string') {
      user.lastName = input.lastName;
    }
    if (typeof input.phone === 'string') {
      user.phone = input.phone;
    }

    return this.repo.save(user);
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.role = role;
    return this.repo.save(user);
  }

  async updateRefreshToken(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.refreshTokenHash = refreshTokenHash;
    return this.repo.save(user);
  }
}

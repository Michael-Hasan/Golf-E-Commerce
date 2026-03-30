import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from './user.entity';
import { IUserRepository } from './user-repository.interface';
import { UserRole } from './user-role.enum';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
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
    const user: User = {
      id: randomUUID(),
      email,
      phone,
      passwordHash,
      role,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index < 0) {
      throw new Error('User not found');
    }

    const current = this.users[index];
    const updated: User = {
      ...current,
      firstName: input.firstName ?? current.firstName ?? null,
      lastName: input.lastName ?? current.lastName ?? null,
      phone: input.phone ?? current.phone,
    };
    this.users[index] = updated;
    return updated;
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index < 0) {
      throw new Error('User not found');
    }
    this.users[index] = { ...this.users[index], role };
    return this.users[index];
  }
}

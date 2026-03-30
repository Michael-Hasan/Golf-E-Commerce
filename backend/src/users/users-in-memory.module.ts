import { Module } from '@nestjs/common';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from './user-repository.interface';
import { InMemoryUserRepository } from './in-memory-user.repository';

@Module({
  providers: [
    UsersService,
    InMemoryUserRepository,
    { provide: USER_REPOSITORY, useExisting: InMemoryUserRepository },
  ],
  exports: [UsersService],
})
export class UsersInMemoryModule {}

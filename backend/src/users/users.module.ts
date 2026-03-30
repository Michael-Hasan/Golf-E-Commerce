import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from './user-repository.interface';
import { TypeOrmUserRepository } from './typeorm-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    TypeOrmUserRepository,
    { provide: USER_REPOSITORY, useExisting: TypeOrmUserRepository },
  ],
  exports: [UsersService],
})
export class UsersModule {}


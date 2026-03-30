import { DynamicModule, Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersInMemoryModule } from './users-in-memory.module';

export interface UsersRootOptions {
  useInMemory: boolean;
}

@Module({})
export class UsersRootModule {
  static forRoot(options: UsersRootOptions): DynamicModule {
    const usersModule = options.useInMemory ? UsersInMemoryModule : UsersModule;
    return {
      module: UsersRootModule,
      imports: [usersModule],
      exports: [usersModule],
    };
  }
}

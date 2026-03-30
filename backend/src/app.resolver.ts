import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { description: 'Simple health check query' })
  health(): string {
    return 'OK';
  }
}


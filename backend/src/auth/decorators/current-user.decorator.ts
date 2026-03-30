import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const gqlContext = GqlExecutionContext.create(context);
    const req = gqlContext.getContext().req as { user: User };
    return req.user;
  },
);

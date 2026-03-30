import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '../../users/user.entity';
import { UserRole } from '../../users/user-role.enum';

@Injectable()
export class HttpAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: User }>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}

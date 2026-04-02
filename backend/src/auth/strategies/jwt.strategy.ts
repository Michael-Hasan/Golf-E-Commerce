import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/user.entity';
import { UserRole } from '../../users/user-role.enum';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: 'access' | 'refresh';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'super-secret-jwt-key',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token user');
    }

    if (user.email !== payload.email || user.role !== payload.role) {
      throw new UnauthorizedException('Token payload is no longer valid');
    }

    return user;
  }
}

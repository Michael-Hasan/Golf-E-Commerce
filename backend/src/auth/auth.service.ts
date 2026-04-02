import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { AppLogger } from '../logging/logger.service';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: 'access' | 'refresh';
};

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly accessTokenTtl = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  private readonly refreshTokenTtl = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET ??
    process.env.JWT_SECRET ??
    'super-secret-jwt-refresh-key';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    logger: AppLogger,
  ) {
    this.logger = logger.withContext(AuthService.name);
  }

  private readonly logger: AppLogger;

  private isAdminEmail(email: string): boolean {
    const configured = process.env.ADMIN_EMAILS ?? '';
    const adminEmails = configured
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(email.trim().toLowerCase());
  }

  async signup(
    email: string,
    phone: string,
    password: string,
  ): Promise<{ user: User } & AuthTokens> {
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    const role = this.isAdminEmail(email) ? UserRole.ADMIN : UserRole.CUSTOMER;

    try {
      const user = await this.usersService.create(email, phone, passwordHash, role);
      const tokens = await this.issueTokens(user);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      this.logger.log('User signup succeeded', {
        userId: user.id,
        role: user.role,
      });
      return { user, ...tokens };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        this.logger.warn('Signup rejected for duplicate email', {
          emailHint: this.maskEmail(email),
        });
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn('Failed login attempt', {
        emailHint: this.maskEmail(email),
        reason: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      this.logger.warn('Failed login attempt', {
        userId: user.id,
        reason: 'invalid_password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string): Promise<{ user: User } & AuthTokens> {
    const user = await this.validateUser(email, password);
    const syncedUser = await this.syncAdminRoleFromEnv(user);
    const tokens = await this.issueTokens(syncedUser);
    await this.storeRefreshToken(syncedUser.id, tokens.refreshToken);
    this.logger.log('User login succeeded', {
      userId: syncedUser.id,
      role: syncedUser.role,
    });
    return { user: syncedUser, ...tokens };
  }

  private async syncAdminRoleFromEnv(user: User): Promise<User> {
    if (user.role === UserRole.ADMIN) {
      return user;
    }
    if (!this.isAdminEmail(user.email)) {
      return user;
    }
    return this.usersService.updateRole(user.id, UserRole.ADMIN);
  }

  async refreshTokens(input: RefreshTokenInput): Promise<{ user: User } & AuthTokens> {
    const payload = await this.verifyRefreshToken(input.refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      this.logger.warn('Refresh token misuse detected', {
        userId: payload.sub,
        reason: 'missing_stored_refresh_token',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      input.refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      this.logger.warn('Refresh token misuse detected', {
        userId: user.id,
        reason: 'refresh_token_hash_mismatch',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const syncedUser = await this.syncAdminRoleFromEnv(user);
    const tokens = await this.issueTokens(syncedUser);
    await this.storeRefreshToken(syncedUser.id, tokens.refreshToken);
    this.logger.log('Refresh token rotated', {
      userId: syncedUser.id,
    });
    return { user: syncedUser, ...tokens };
  }

  async logout(userId: string): Promise<boolean> {
    await this.usersService.clearRefreshToken(userId);
    this.logger.log('User logged out', { userId });
    return true;
  }

  getCurrentUser(user: User): User {
    return user;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.accessTokenTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTtl,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);
    await this.usersService.updateRefreshToken(userId, refreshTokenHash);
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });

      if (payload.tokenType !== 'refresh') {
        this.logger.warn('Refresh token misuse detected', {
          reason: 'non_refresh_token_supplied',
        });
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      this.logger.warn('Refresh token verification failed', {
        reason: 'token_verification_failed',
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.trim().toLowerCase().split('@');
    if (!localPart || !domain) {
      return 'unknown';
    }
    return `${localPart.slice(0, 2)}***@${domain}`;
  }
}

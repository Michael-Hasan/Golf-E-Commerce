import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { MyPageData } from './models/my-page.model';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UserRole } from '../users/user-role.enum';
import { CheckoutService } from '../checkout/checkout.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly checkoutService: CheckoutService,
  ) {}

  private readonly saltRounds = 10;

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
  ): Promise<{ user: User; accessToken: string }> {
    const passwordHash = await bcrypt.hash(password, this.saltRounds);
    const role = this.isAdminEmail(email) ? UserRole.ADMIN : UserRole.CUSTOMER;
    const user = await this.usersService.create(email, phone, passwordHash, role);
    const accessToken = await this.generateToken(user);
    return { user, accessToken };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    const user = await this.validateUser(email, password);
    const syncedUser = await this.syncAdminRoleFromEnv(user);
    const accessToken = await this.generateToken(syncedUser);
    return { user: syncedUser, accessToken };
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

  private async generateToken(user: User): Promise<string> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload);
  }

  getCurrentUser(user: User): User {
    return user;
  }

  async getMyPageData(user: User): Promise<MyPageData> {
    const displayName = this.toDisplayName(user);
    const recentOrders = this.checkoutService.getRecentOrdersForEmail(user.email);
    const wishlist = [
      {
        brand: 'Scotty Cameron',
        productName: 'Scotty Cameron Phantom',
        price: 449.99,
      },
      {
        brand: 'Bushnell',
        productName: 'Bushnell Pro X3 Rangefinder',
        price: 549.99,
      },
      {
        brand: 'FootJoy',
        productName: 'FootJoy Tour Alpha',
        price: 219.99,
      },
    ];
    const rewardPoints = recentOrders.reduce(
      (sum, order) => sum + Math.round(order.totalAmount),
      0,
    );

    return {
      user,
      displayName,
      memberTier: 'Gold Member',
      stats: {
        totalOrders: recentOrders.length,
        wishlistItems: wishlist.length,
        rewardPoints,
      },
      recentOrders,
      wishlist,
      savedAddresses: [
        {
          label: 'Home',
          line1: '123 Golf Course Drive',
          line2: '',
          city: 'Pebble Beach',
          region: 'CA',
          postalCode: '93953',
          country: 'United States',
          isDefault: true,
        },
        {
          label: 'Office',
          line1: '456 Business Park Ave',
          line2: 'Suite 200',
          city: 'San Francisco',
          region: 'CA',
          postalCode: '94107',
          country: 'United States',
          isDefault: false,
        },
      ],
    };
  }

  async updateMyProfile(user: User, input: UpdateProfileInput): Promise<MyPageData> {
    const updatedUser = await this.usersService.updateProfile(user.id, {
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      phone: input.phone?.trim(),
    });
    return this.getMyPageData(updatedUser);
  }

  private toDisplayName(user: User): string {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (fullName) {
      return fullName;
    }

    const email = user.email;
    const localPart = email.split('@')[0] ?? '';
    const words = localPart
      .split(/[._-]+/)
      .map((word) => word.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (!words.length) {
      return 'Golf Member';
    }

    return words
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

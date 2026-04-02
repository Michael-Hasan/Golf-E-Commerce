import { Inject, Injectable } from '@nestjs/common';
import { ORDER_READER, OrderReader } from '../shared/contracts/order-reader.contract';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { MyPageData } from './entities/my-page.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { AppLogger } from '../logging/logger.service';
import { MyOrdersQueryInput } from './dto/my-orders-query.input';
import { PaginatedMyOrders } from './entities/paginated-my-orders.entity';

@Injectable()
export class AccountService {
  private readonly logger: AppLogger;

  constructor(
    private readonly usersService: UsersService,
    @Inject(ORDER_READER)
    private readonly orderReader: OrderReader,
    logger: AppLogger,
  ) {
    this.logger = logger.withContext(AccountService.name);
  }

  async getMyPageData(user: User): Promise<MyPageData> {
    const displayName = this.toDisplayName(user);
    const recentOrders = await this.orderReader.getRecentOrdersForEmail(user.email);
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

    this.logger.log('Account page data loaded', {
      userId: user.id,
      recentOrderCount: recentOrders.length,
    });

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
    this.logger.log('Account profile updated', {
      userId: user.id,
      updatedFields: Object.keys(input).filter(
        (key) => input[key as keyof UpdateProfileInput] !== undefined,
      ),
    });
    return this.getMyPageData(updatedUser);
  }

  async getMyOrders(
    user: User,
    input: MyOrdersQueryInput,
  ): Promise<PaginatedMyOrders> {
    const allOrders = await this.orderReader.getRecentOrdersForEmail(user.email);
    const start = (input.page - 1) * input.limit;
    const items = allOrders.slice(start, start + input.limit);

    this.logger.log('Paginated orders loaded', {
      userId: user.id,
      page: input.page,
      limit: input.limit,
      total: allOrders.length,
    });

    return {
      items,
      total: allOrders.length,
      page: input.page,
      limit: input.limit,
    };
  }

  private toDisplayName(user: User): string {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (fullName) {
      return fullName;
    }

    const localPart = user.email.split('@')[0] ?? '';
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

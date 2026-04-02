import * as bcrypt from 'bcrypt';
import { appDataSource } from '../database/data-source';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user-role.enum';
import { CatalogProduct } from '../catalog/catalog-product.entity';
import { CatalogProductSource } from '../catalog/catalog-product-source.enum';

async function seed(): Promise<void> {
  await appDataSource.initialize();

  const userRepo = appDataSource.getRepository(User);
  const catalogRepo = appDataSource.getRepository(CatalogProduct);

  const adminEmail = 'admin@golfecommerce.dev';
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin1234!', 12);
    await userRepo.save(
      userRepo.create({
        email: adminEmail,
        phone: '+1 555 111 2222',
        passwordHash,
        role: UserRole.ADMIN,
      }),
    );
  }

  const products = [
    {
      source: CatalogProductSource.CLUBS,
      category: 'Drivers',
      brand: 'TaylorMade',
      name: 'Qi10 Max Driver',
      price: 599.99,
      rating: 4.8,
      reviewCount: 94,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/golf/qi10-max-driver.jpg',
      description: 'Forgiving premium driver for high-launch distance.',
      isFeatured: true,
      isActive: true,
    },
    {
      source: CatalogProductSource.BALLS,
      category: 'Golf Balls',
      brand: 'Titleist',
      name: 'Pro V1',
      price: 54.99,
      rating: 4.9,
      reviewCount: 213,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/golf/pro-v1.jpg',
      description: 'Tour-proven premium golf ball.',
      isFeatured: true,
      isActive: true,
    },
    {
      source: CatalogProductSource.BAGS,
      category: 'Carry Bags',
      brand: 'Vessel',
      name: 'Player V Pro Stand Bag',
      price: 429.99,
      rating: 4.7,
      reviewCount: 41,
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/golf/player-v-pro-stand-bag.jpg',
      description: 'Premium stand bag with modern storage layout.',
      isFeatured: false,
      isActive: true,
    },
  ];

  for (const product of products) {
    const existing = await catalogRepo.findOne({
      where: {
        source: product.source,
        brand: product.brand,
        name: product.name,
      },
    });
    if (!existing) {
      await catalogRepo.save(catalogRepo.create(product));
    }
  }

  await appDataSource.destroy();
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  process.exit(1);
});

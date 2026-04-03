export type Mode = "login" | "signup";
export type UserRole = "CUSTOMER" | "ADMIN";

export type User = {
  id: string;
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
};

export type MyPageData = {
  user: User;
  displayName: string;
  memberTier: string;
  stats: {
    totalOrders: number;
    wishlistItems: number;
    rewardPoints: number;
  };
  recentOrders: Array<{
    orderNumber: string;
    orderDate: string;
    itemCount: number;
    status: string;
    totalAmount: number;
  }>;
  wishlist: Array<{
    brand: string;
    productName: string;
    price: number;
  }>;
  savedAddresses: Array<{
    label: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
};

export type SaleItem = {
  id: string;
  category: string;
  saleGroup: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  salePrice: number;
  originalPrice: number;
  badge?: string;
  imageUrl?: string;
};

export type CartItem = {
  id: string;
  brand: string;
  name: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
};

export type PlaceOrderInput = {
  contactEmail: string;
  contactPhone: string;
  deliveryName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  shippingMethod: "STANDARD" | "EXPRESS";
  paymentMethod: "CARD" | "PAYPAL" | "BANK_TRANSFER";
  cardHolderName: string;
  cardNumberMasked: string;
  cardExpiry: string;
  items: Array<{
    id: string;
    brand: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type CheckoutOrderResult = {
  orderNumber: string;
  placedAtIso: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  contactEmail: string;
  deliveryName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  items: Array<{
    id: string;
    brand: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type ClubItem = {
  id: string;
  category:
    | "Drivers"
    | "Irons"
    | "Putters"
    | "Fairway Woods"
    | "Hybrids"
    | "Wedges";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "New" | "Popular" | "Sale";
  imageUrl?: string;
};

export type BallItem = {
  id: string;
  category: "Tour Performance" | "Distance" | "Low Compression" | "Value";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Best Value";
  imageUrl?: string;
};

export type BagItem = {
  id: string;
  category:
    | "Stand Bags"
    | "Cart Bags"
    | "Travel Bags"
    | "Staff Bags"
    | "Carry Bags";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium";
  imageUrl?: string;
};

export type ApparelItem = {
  id: string;
  category: "Shoes" | "Polos" | "Pants" | "Shorts" | "Headwear" | "Gloves";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium" | "Best Value";
  imageUrl?: string;
};

export type AccessoryItem = {
  id: string;
  category:
    | "Rangefinders"
    | "GPS Watches"
    | "Grips"
    | "Training Aids"
    | "Tees"
    | "Divot Tools";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium";
  imageUrl?: string;
};

export type ProductDetailData = {
  id: string;
  source: string;
  category: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  imageUrl?: string;
  description: string;
};

export type ChatIdentity = {
  userId: string;
  userName: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

export type AiPanelMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type CartFlyOrigin = { clientX: number; clientY: number };

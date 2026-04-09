export type CatalogProductSource =
  | "CLUBS"
  | "BALLS"
  | "BAGS"
  | "APPAREL"
  | "ACCESSORIES"
  | "SALE";

export type AdminCatalogProduct = {
  id: string;
  source: CatalogProductSource;
  category: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

export type AdminCatalogProductsResponse = {
  items: AdminCatalogProduct[];
  total: number;
  page: number;
  limit: number;
};

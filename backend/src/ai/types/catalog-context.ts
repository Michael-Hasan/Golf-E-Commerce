export type CatalogSource =
  | 'CLUBS'
  | 'BALLS'
  | 'BAGS'
  | 'APPAREL'
  | 'ACCESSORIES'
  | 'SALE';

export type CatalogItem = {
  id: string;
  source: CatalogSource;
  category: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
};

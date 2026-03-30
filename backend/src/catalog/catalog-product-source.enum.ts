import { registerEnumType } from '@nestjs/graphql';

export enum CatalogProductSource {
  CLUBS = 'CLUBS',
  BALLS = 'BALLS',
  BAGS = 'BAGS',
  APPAREL = 'APPAREL',
  ACCESSORIES = 'ACCESSORIES',
  SALE = 'SALE',
}

registerEnumType(CatalogProductSource, {
  name: 'CatalogProductSource',
});

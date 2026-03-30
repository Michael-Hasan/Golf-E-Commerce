export const SUPPORT_PAGE_SLUGS = [
  'home',
  'contact',
  'faqs',
  'shipping',
  'returns',
  'size-guide',
  'track-order',
  'privacy',
  'terms',
  'cookies',
] as const;

export type SupportPageSlug = (typeof SUPPORT_PAGE_SLUGS)[number];

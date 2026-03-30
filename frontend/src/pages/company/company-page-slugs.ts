export const COMPANY_PAGE_SLUGS = [
  "careers",
  "press",
  "blog",
  "partners",
  "affiliates",
] as const;

export type CompanyPageSlug = (typeof COMPANY_PAGE_SLUGS)[number];

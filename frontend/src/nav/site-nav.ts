export type SiteNavGroupId = "shop" | "support" | "company";

export type SiteNavLink = {
  labelKey: string;
  to: string;
  /** Show “Hot” pill next to label (e.g. Sale). */
  hotBadge?: boolean;
};

export type SiteNavGroup = {
  id: SiteNavGroupId;
  titleKey: string;
  links: SiteNavLink[];
};

/**
 * Single source for primary header menus (Shop, Support, Company).
 * Paths mirror the footer intent; update here when adding real pages.
 */
export const SITE_NAV_GROUPS: SiteNavGroup[] = [
  {
    id: "shop",
    titleKey: "nav.primaryShop",
    links: [
      { labelKey: "nav.clubs", to: "/clubs" },
      { labelKey: "nav.balls", to: "/balls" },
      { labelKey: "nav.bags", to: "/bags" },
      { labelKey: "nav.apparel", to: "/apparel" },
      { labelKey: "nav.accessories", to: "/accessories" },
      { labelKey: "nav.sale", to: "/sale", hotBadge: true },
    ],
  },
  {
    id: "support",
    titleKey: "nav.primarySupport",
    links: [
      { labelKey: "nav.primarySupport", to: "/support" },
      { labelKey: "footer.linkContact", to: "/support/contact" },
      { labelKey: "footer.linkFaqs", to: "/support/faqs" },
      { labelKey: "footer.linkShipping", to: "/support/shipping" },
      { labelKey: "footer.linkReturns", to: "/support/returns" },
      { labelKey: "footer.linkSizeGuide", to: "/support/size-guide" },
      { labelKey: "footer.linkTrackOrder", to: "/support/track-order" },
      { labelKey: "footer.privacy", to: "/support/privacy" },
      { labelKey: "footer.terms", to: "/support/terms" },
      { labelKey: "footer.cookies", to: "/support/cookies" },
    ],
  },
  {
    id: "company",
    titleKey: "nav.primaryCompany",
    links: [
      { labelKey: "footer.linkAbout", to: "/about" },
      { labelKey: "footer.linkCareers", to: "/careers" },
      { labelKey: "footer.linkPress", to: "/press" },
      { labelKey: "footer.linkBlog", to: "/blog" },
      { labelKey: "footer.linkPartners", to: "/partners" },
      { labelKey: "footer.linkAffiliates", to: "/affiliates" },
    ],
  },
];

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type LinkGroup = {
  titleKey: string;
  links: Array<{ labelKey: string; to: string }>;
};

const LINK_GROUPS: LinkGroup[] = [
  {
    titleKey: "footer.shopTitle",
    links: [
      { labelKey: "footer.linkAllClubs", to: "/clubs" },
      { labelKey: "footer.linkBalls", to: "/balls" },
      { labelKey: "footer.linkBags", to: "/bags" },
      { labelKey: "footer.linkApparel", to: "/apparel" },
      { labelKey: "footer.linkFootwear", to: "/apparel" },
      { labelKey: "footer.linkAccessories", to: "/accessories" },
    ],
  },
  {
    titleKey: "footer.supportTitle",
    links: [
      { labelKey: "footer.linkContact", to: "/support/contact" },
      { labelKey: "footer.linkFaqs", to: "/support/faqs" },
      { labelKey: "footer.linkShipping", to: "/support/shipping" },
      { labelKey: "footer.linkReturns", to: "/support/returns" },
      { labelKey: "footer.linkSizeGuide", to: "/support/size-guide" },
      { labelKey: "footer.linkTrackOrder", to: "/support/track-order" },
    ],
  },
  {
    titleKey: "footer.companyTitle",
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

export function FooterLinkGroups() {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
      {LINK_GROUPS.map((group) => (
        <div key={group.titleKey}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--gl-heading)]">
            {t(group.titleKey)}
          </h3>
          <ul className="mt-4 space-y-3">
            {group.links.map((link) => (
              <li key={link.labelKey}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

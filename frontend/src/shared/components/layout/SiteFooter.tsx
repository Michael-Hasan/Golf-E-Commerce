import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FooterNewsletter } from "./FooterNewsletter";
import { FooterSocialLinks } from "./FooterSocialLinks";
import { FooterLinkGroups } from "./FooterLinkGroups";
import { FooterLegalLinks } from "./FooterLegalLinks";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[var(--gl-footer-top)] bg-[var(--gl-footer-bg)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22c55e]">
                <span className="text-lg font-bold text-[#062412]">G</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--gl-heading)]">
                {t("brand.greenlinks")}
              </span>
            </Link>

            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {t("footer.tagline")}
            </p>

            <FooterNewsletter />
            <FooterSocialLinks />
          </div>

          <FooterLinkGroups />
        </div>

        <FooterLegalLinks />
      </div>
    </footer>
  );
}

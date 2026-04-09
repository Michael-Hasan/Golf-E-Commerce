import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav, SiteFooter } from "../../../components/app-frame";
import CompanyMarketingPageView from "../../CompanyMarketingPageView";
import type { CompanyPageSlug } from "../../company/company-page-slugs";

export function CompanyShell({ slug }: { slug: CompanyPageSlug }) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = t(`company.${slug}.pageTitle`);
    return () => {
      document.title = previous;
    };
  }, [slug, t, i18n.language]);

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("search.placeholderNav")}
      />
      <CompanyMarketingPageView slug={slug} />
      <SiteFooter />
    </div>
  );
}

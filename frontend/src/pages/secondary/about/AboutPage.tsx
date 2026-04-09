import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TopNav, SiteFooter } from "../../../components/app-frame";
import AboutPageView from "../../AboutPageView";

export function AboutPage() {
  const { t, i18n } = useTranslation();
  const [aboutSearch, setAboutSearch] = useState("");

  useEffect(() => {
    const previous = document.title;
    document.title = t("about.pageTitle");
    return () => {
      document.title = previous;
    };
  }, [t, i18n.language]);

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={aboutSearch}
        onSearchChange={setAboutSearch}
        searchPlaceholder={t("search.placeholderNav")}
      />
      <AboutPageView />
      <SiteFooter />
    </div>
  );
}

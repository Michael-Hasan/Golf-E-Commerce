import React, { useState } from "react";
import { TopNav } from "../../../components/app-frame";
import SupportPageView from "../../SupportPageView";
import { SiteFooter } from "../../../components/app-frame";
import type { SupportPageSlug } from "../../support/support-page-slugs";

export function SupportShell({ slug }: { slug: SupportPageSlug }) {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products, support articles, or order info"
      />
      <SupportPageView slug={slug} />
      <SiteFooter />
    </div>
  );
}

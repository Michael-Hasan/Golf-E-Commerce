import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { CompanyPageSlug } from "./company/company-page-slugs";

type Props = { slug: CompanyPageSlug };

/** Breadcrumb + hero shared by all company marketing pages. */
function CompanyChrome({
  breadcrumbCurrent,
  kicker,
  heroTitle,
  heroLead,
}: {
  breadcrumbCurrent: string;
  kicker: string;
  heroTitle: string;
  heroLead: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="border-b border-[var(--gl-border)] bg-[var(--gl-surface-60)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-slate-600 dark:text-slate-400"
          >
            <Link
              to="/"
              className="font-medium text-[var(--gl-accent-text)] transition-colors hover:underline"
            >
              {t("about.breadcrumbHome")}
            </Link>
            <span className="mx-2 opacity-60" aria-hidden>
              /
            </span>
            <span className="font-semibold text-[var(--gl-heading)]">
              {breadcrumbCurrent}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-[var(--gl-border)]">
        <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25">
          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#22c55e]/25 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-[#ca8a04]/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--gl-accent-text)]">
            {kicker}
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            {heroLead}
          </p>
        </div>
      </section>
    </>
  );
}

function CtaBand({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-[var(--gl-border)] bg-gradient-to-br from-[#22c55e]/12 via-[var(--gl-surface)] to-transparent px-8 py-12 dark:from-[#22c55e]/8 sm:px-12 sm:py-14">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">{lead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {children}
        </div>
      </div>
    </section>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#2fd668]";
const btnSecondary =
  "inline-flex items-center justify-center rounded-md border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-[var(--gl-raised)] dark:text-slate-100";
const btnLink =
  "inline-flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-semibold text-[var(--gl-accent-text)] underline-offset-4 hover:underline sm:px-4";

export default function CompanyMarketingPageView({ slug }: Props) {
  const { t } = useTranslation();
  const c = (key: string) => t(`company.${slug}.${key}`);

  const chrome = (
    <CompanyChrome
      breadcrumbCurrent={c("breadcrumbCurrent")}
      kicker={c("kicker")}
      heroTitle={c("heroTitle")}
      heroLead={c("heroLead")}
    />
  );

  if (slug === "careers") {
    return (
      <main className="flex-1">
        {chrome}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
                {c("blockTitle")}
              </h2>
            </div>
            <div className="space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:col-span-7">
              <p>{c("blockP1")}</p>
              <p>{c("blockP2")}</p>
            </div>
          </div>
          <ul className="mt-12 grid gap-6 sm:grid-cols-3">
            {(
              [
                ["card1Title", "card1Body"],
                ["card2Title", "card2Body"],
                ["card3Title", "card3Body"],
              ] as const
            ).map(([titleKey, bodyKey]) => (
              <li
                key={titleKey}
                className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6 shadow-sm"
              >
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--gl-heading)]">
                  {c(titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {c(bodyKey)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
              {c("rolesTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {c("rolesHint")}
            </p>
            <ul className="mt-8 space-y-4">
              {(
                [
                  ["role1Title", "role1Meta", "role1Desc"],
                  ["role2Title", "role2Meta", "role2Desc"],
                  ["role3Title", "role3Meta", "role3Desc"],
                ] as const
              ).map(([titleKey, metaKey, descKey]) => (
                <li
                  key={titleKey}
                  className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6"
                >
                  <h3 className="font-semibold text-[var(--gl-heading)]">{c(titleKey)}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--gl-accent-text)]">
                    {c(metaKey)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {c(descKey)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CtaBand title={c("ctaTitle")} lead={c("ctaLead")}>
          <Link to="/my-page" className={btnPrimary}>
            {c("ctaPrimary")}
          </Link>
          <Link to="/about" className={btnSecondary}>
            {c("ctaSecondary")}
          </Link>
          <Link to="/clubs" className={btnLink}>
            {c("ctaTertiary")}
          </Link>
        </CtaBand>
      </main>
    );
  }

  if (slug === "press") {
    return (
      <main className="flex-1">
        {chrome}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("kitTitle")}
          </h2>
          <ul className="mt-6 space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="text-[#22c55e]" aria-hidden>
                •
              </span>
              <span>{c("kitLi1")}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#22c55e]" aria-hidden>
                •
              </span>
              <span>{c("kitLi2")}</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#22c55e]" aria-hidden>
                •
              </span>
              <span>{c("kitLi3")}</span>
            </li>
          </ul>

          <h2 className="mt-14 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("newsTitle")}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {(
              [
                ["n1Title", "n1Body"],
                ["n2Title", "n2Body"],
                ["n3Title", "n3Body"],
              ] as const
            ).map(([titleKey, bodyKey]) => (
              <article
                key={titleKey}
                className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6"
              >
                <h3 className="font-semibold text-[var(--gl-heading)]">{c(titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {c(bodyKey)}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface-60)] p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--gl-heading)]">
              {c("inquiryTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {c("inquiryBody")}
            </p>
          </div>
        </section>

        <CtaBand title={c("ctaTitle")} lead={c("ctaLead")}>
          <Link to="/my-page" className={btnPrimary}>
            {c("ctaPrimary")}
          </Link>
          <Link to="/about" className={btnSecondary}>
            {c("ctaSecondary")}
          </Link>
        </CtaBand>
      </main>
    );
  }

  if (slug === "blog") {
    const posts: Array<{
      titleKey: "p1Title" | "p2Title" | "p3Title";
      metaKey: "p1Meta" | "p2Meta" | "p3Meta";
      excerptKey: "p1Excerpt" | "p2Excerpt" | "p3Excerpt";
      to: string;
    }> = [
      { titleKey: "p1Title", metaKey: "p1Meta", excerptKey: "p1Excerpt", to: "/clubs" },
      { titleKey: "p2Title", metaKey: "p2Meta", excerptKey: "p2Excerpt", to: "/sale" },
      { titleKey: "p3Title", metaKey: "p3Meta", excerptKey: "p3Excerpt", to: "/balls" },
    ];
    return (
      <main className="flex-1">
        {chrome}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("introTitle")}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {c("introBody")}
          </p>

          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <li key={post.titleKey}>
                <Link
                  to={post.to}
                  className="group flex h-full flex-col rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6 shadow-sm transition-all hover:border-[#22c55e]/40 hover:shadow-md"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--gl-accent-text)]">
                    {c(post.metaKey)}
                  </p>
                  <h3 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--gl-heading)] group-hover:text-[var(--gl-accent-text)]">
                    {c(post.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {c(post.excerptKey)}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-[var(--gl-accent-text)]">
                    {c("readMore")} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <CtaBand title={c("ctaTitle")} lead={c("ctaLead")}>
          <Link to="/sale" className={btnPrimary}>
            {c("ctaSale")}
          </Link>
          <Link to="/clubs" className={btnSecondary}>
            {c("ctaClubs")}
          </Link>
          <Link to="/balls" className={btnLink}>
            {c("ctaBalls")}
          </Link>
        </CtaBand>
      </main>
    );
  }

  if (slug === "partners") {
    return (
      <main className="flex-1">
        {chrome}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <ul className="grid gap-6 md:grid-cols-3">
            {(
              [
                ["pillar1Title", "pillar1Body"],
                ["pillar2Title", "pillar2Body"],
                ["pillar3Title", "pillar3Body"],
              ] as const
            ).map(([titleKey, bodyKey]) => (
              <li
                key={titleKey}
                className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6 shadow-sm"
              >
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--gl-heading)]">
                  {c(titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {c(bodyKey)}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-16 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("processTitle")}
          </h2>
          <ol className="mt-8 space-y-4">
            {(["step1", "step2", "step3"] as const).map((stepKey, index) => (
              <li
                key={stepKey}
                className="flex gap-4 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 text-sm font-bold text-[#166534] dark:text-[#86efac]">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {c(stepKey)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <CtaBand title={c("ctaTitle")} lead={c("ctaLead")}>
          <Link to="/my-page" className={btnPrimary}>
            {c("ctaPrimary")}
          </Link>
          <Link to="/about" className={btnSecondary}>
            {c("ctaSecondary")}
          </Link>
          <Link to="/affiliates" className={btnLink}>
            {c("ctaTertiary")}
          </Link>
        </CtaBand>
      </main>
    );
  }

  if (slug === "affiliates") {
    return (
      <main className="flex-1">
        {chrome}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("benefitTitle")}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {(["b1", "b2", "b3", "b4"] as const).map((key) => (
              <li
                key={key}
                className="flex gap-3 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 text-xs font-bold text-[#166534] dark:text-[#86efac]"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{c(key)}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-14 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {c("howTitle")}
          </h2>
          <ol className="mt-6 space-y-3">
            {(["how1", "how2", "how3"] as const).map((key, index) => (
              <li
                key={key}
                className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
              >
                <span className="font-bold text-[var(--gl-accent-text)]">{index + 1}.</span>
                <span>{c(key)}</span>
              </li>
            ))}
          </ol>

          <p className="mt-10 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {c("legalNote")}
          </p>
        </section>

        <CtaBand title={c("ctaTitle")} lead={c("ctaLead")}>
          <Link to="/my-page" className={btnPrimary}>
            {c("ctaPrimary")}
          </Link>
          <Link to="/partners" className={btnSecondary}>
            {c("ctaSecondary")}
          </Link>
          <Link to="/sale" className={btnLink}>
            {c("ctaShop")}
          </Link>
        </CtaBand>
      </main>
    );
  }

  return null;
}

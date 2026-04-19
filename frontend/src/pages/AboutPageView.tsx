import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Marketing / About Us body only. Parent supplies TopNav + SiteFooter + app shell.
 */
export default function AboutPageView() {
  const { t } = useTranslation();

  return (
    <main className="flex-1">
      <div className="border-b border-[var(--gl-border)] bg-[var(--gl-surface-60)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-600 dark:text-slate-400">
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
              {t("about.breadcrumbCurrent")}
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
            {t("about.kicker")}
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
            {t("about.heroTitle")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            {t("about.heroLead")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
              {t("about.storyTitle")}
            </h2>
            <p className="mt-2 text-sm font-medium text-[var(--gl-accent-text)]">
              {t("about.storyTagline")}
            </p>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:col-span-7">
            <p>{t("about.storyP1")}</p>
            <p>{t("about.storyP2")}</p>
            <p>{t("about.storyP3")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <figure className="lg:col-span-5">
            <img
              src="/evergreen-greens-golf.svg"
              alt="Evergreen Greens Golf Co. emblem with a flag on a course"
              className="h-[280px] w-full rounded-3xl border border-[var(--gl-border)] bg-[var(--gl-surface)] object-cover shadow-xl"
              loading="lazy"
            />
            <figcaption className="mt-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Evergreen Greens Golf Co.
            </figcaption>
          </figure>
          <div className="space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 lg:col-span-7">
            <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)]">
              The company behind the course
            </h3>
            <p>
              Evergreen Greens Golf Co. has shaped championship-caliber courses and premium practice spaces for twenty-seven years, bringing regenerative turf science
              and thoughtful hospitality to every layout.
            </p>
            <p>
              We partner with Evergreen Greens to deliver authentic, course-inspired products because their drives align with ours: precision, sustainability, and a love for the
              game that is built to last.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
              {t("about.missionTitle")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {t("about.missionLead")}
            </p>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {(
              [
                {
                  icon: "⛳",
                  titleKey: "about.value1Title",
                  bodyKey: "about.value1Body",
                },
                {
                  icon: "🎯",
                  titleKey: "about.value2Title",
                  bodyKey: "about.value2Body",
                },
                {
                  icon: "🤝",
                  titleKey: "about.value3Title",
                  bodyKey: "about.value3Body",
                },
              ] as const
            ).map((card) => (
              <li
                key={card.titleKey}
                className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-2xl" aria-hidden>
                  {card.icon}
                </span>
                <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--gl-heading)]">
                  {t(card.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t(card.bodyKey)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
          {t("about.promiseTitle")}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {(
            [
              "about.promise1",
              "about.promise2",
              "about.promise3",
              "about.promise4",
            ] as const
          ).map((key) => (
            <li
              key={key}
              className="flex gap-3 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-4 py-3 text-slate-700 dark:text-slate-300"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#22c55e]/20 text-sm font-bold text-[#166534] dark:text-[#86efac]"
                aria-hidden
              >
                ✓
              </span>
              <span className="text-sm leading-relaxed">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {t("about.statsTitle")}
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {(
              [
                ["about.stat1Value", "about.stat1Label"],
                ["about.stat2Value", "about.stat2Label"],
                ["about.stat3Value", "about.stat3Label"],
              ] as const
            ).map(([valueKey, labelKey]) => (
              <div
                key={valueKey}
                className="text-center rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-6 py-8"
              >
                <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[#22c55e] sm:text-4xl">
                  {t(valueKey)}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t(labelKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
              Meet the crew
            </h2>
            <p className="mt-2 text-sm font-medium text-[var(--gl-accent-text)]">
              Founders, caddies, and craftspersons who keep our gear rooted in course wisdom.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-2">
              {(
                [
                  {
                    name: "Avery Kim",
                    role: "Founding Course Strategist",
                    detail: "Translates touring insights into every club profile and green craft narrative.",
                    image: "https://images.pexels.com/photos/6573246/pexels-photo-6573246.jpeg?auto=compress&cs=tinysrgb&h=400&w=400",
                  },
                  {
                    name: "Jordan Silva",
                    role: "Director of Fit & Fabrication",
                    detail: "Leads performance fittings with data + instinct so partners always feel the right swing in hand.",
                    image: "https://images.pexels.com/photos/6256830/pexels-photo-6256830.jpeg?auto=compress&cs=tinysrgb&h=400&w=400",
                  },
                  {
                    name: "Harper Li",
                    role: "Retail Host & Community Lead",
                    detail: "Keeps our store experiences warm and ensures local players get the thoughtful service they deserve.",
                    image: "https://images.pexels.com/photos/4475691/pexels-photo-4475691.jpeg?auto=compress&cs=tinysrgb&h=400&w=400",
                  },
                  {
                    name: "Emmett Ortiz",
                    role: "On-course Crew Lead",
                    detail: "Builds and maintains the demo rigs, instruction hubs, and pop-up clinics we visit together.",
                    image: "https://images.pexels.com/photos/7677636/pexels-photo-7677636.jpeg?auto=compress&cs=tinysrgb&h=400&w=400",
                  },
                ] as const
              ).map((person) => (
                <article
                  key={person.name}
                  className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-full border border-[var(--gl-border-soft)] bg-[var(--gl-raised)]">
                      <img
                        src={person.image}
                        alt={`${person.name} portrait`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                        {person.role}
                      </p>
                      <h3 className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--gl-heading)]">
                        {person.name}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {person.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="lg:w-1/3">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
                Milestones on the green
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Key steps in how Evergreen Greens Golf Co. and our partners have grown from a single practice bay to a national platform.
              </p>
            </div>
            <ol className="lg:w-2/3 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {(
                [
                  { year: "1999", label: "First course partnership in Oregon’s Willamette Valley" },
                  { year: "2008", label: "Opened the flagship fitting loft in Scottsdale" },
                  { year: "2016", label: "Launched the regenerative turf lab with touring agronomists" },
                  { year: "2023", label: "Built mobile demo rigs for coast-to-coast pop-up clinics" },
                ] as const
              ).map((event) => (
                <li key={event.year} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] font-[family-name:var(--font-heading)] text-lg font-bold text-[#22c55e]">
                    {event.year.slice(-2)}
                  </div>
                  <span>{event.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--gl-border)] bg-gradient-to-br from-[#22c55e]/12 via-[var(--gl-surface)] to-transparent px-8 py-12 dark:from-[#22c55e]/8 sm:px-12 sm:py-14">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--gl-heading)] sm:text-3xl">
            {t("about.ctaTitle")}
          </h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            {t("about.ctaLead")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/clubs"
              className="inline-flex items-center justify-center rounded-md bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#2fd668]"
            >
              {t("about.ctaShop")}
            </Link>
            <Link
              to="/sale"
              className="inline-flex items-center justify-center rounded-md border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-6 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-[var(--gl-raised)] dark:text-slate-100"
            >
              {t("about.ctaSale")}
            </Link>
            <Link
              to="/my-page"
              className="inline-flex items-center justify-center rounded-md px-2 py-2.5 text-sm font-semibold text-[var(--gl-accent-text)] underline-offset-4 hover:underline sm:px-4"
            >
              {t("about.ctaContact")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

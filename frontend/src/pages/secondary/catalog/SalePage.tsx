import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchSaleProducts } from "../../../lib/catalog-api";
import {
  getProductImageUrl,
  isValidEmail,
  saveNewsletterEmail,
} from "../../../lib/app-utils";
import {
  SiteFooter,
  TopNav,
  WishlistToggleButton,
} from "../../../components/app-frame";
import type { SaleItem } from "../../../types/app";

export default function SalePage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState<
    "DISCOUNT_DESC" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("DISCOUNT_DESC");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<SaleItem[]>([]);
  const [allProducts, setAllProducts] = useState<SaleItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saleAlertEmail, setSaleAlertEmail] = useState("");
  const [saleAlertMessage, setSaleAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSaleProducts(selectedCategory, selectedSort, searchQuery).then(
      (result) => {
        if (result.error || !result.data) {
          setError(result.error ?? t("catalog.failedSale"));
          setProducts([]);
        } else {
          setProducts(result.data);
        }
        setLoading(false);
      },
    );
  }, [selectedCategory, selectedSort, searchQuery, t]);

  useEffect(() => {
    fetchSaleProducts("all", "DISCOUNT_DESC").then((result) => {
      if (result.data) {
        setAllProducts(result.data);
      }
    });
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of allProducts) {
      const bucket = product.saleGroup || product.category;
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }
    return counts;
  }, [allProducts]);

  const saleSidebarLabelKeys: Record<string, string> = {
    Clubs: "nav.clubs",
    Bags: "nav.bags",
    Balls: "nav.balls",
    Apparel: "nav.apparel",
    Accessories: "nav.accessories",
  };

  const handleSaleAlertSubscribe = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const email = saleAlertEmail.trim();

    if (!isValidEmail(email)) {
      setSaleAlertMessage({
        type: "error",
        text: t("sale.emailInvalid"),
      });
      return;
    }

    const status = saveNewsletterEmail(email);
    setSaleAlertMessage({
      type: "success",
      text:
        status === "exists" ? t("sale.emailExists") : t("sale.emailSubscribed"),
    });
    setSaleAlertEmail("");
  };

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("search.placeholderProduct")}
      />

      <section className="relative overflow-hidden border-b border-[var(--gl-border)] bg-[var(--gl-page)] py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(239,68,68,0.35),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_84%,rgba(34,197,94,0.24),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#260508]/25 via-transparent to-[#0a2a1a]/20" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative text-center">
            <span className="mb-4 inline-flex items-center rounded-md bg-[#ef4444] px-4 py-1.5 text-sm font-bold text-white shadow-[0_6px_18px_rgba(239,68,68,0.3)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
              </svg>
              {t("sale.limitedOffer")}
            </span>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl lg:text-6xl">
              {t("sale.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-400">
              {t("sale.sub")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2 rounded-full border border-rose-200/90 bg-rose-50/95 px-4 py-2 shadow-sm dark:border-[#5c1f2e] dark:bg-[#2c0d15]/90 dark:shadow-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-rose-600 dark:text-[#ef4444]"
                  aria-hidden="true"
                >
                  <line x1="19" x2="5" y1="5" y2="19" />
                  <circle cx="6.5" cy="6.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
                <span className="font-medium text-rose-950 dark:text-slate-100">
                  {t("sale.off40")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/95 px-4 py-2 shadow-sm dark:border-[var(--gl-border)] dark:bg-[#10261a]/90 dark:shadow-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-emerald-700 dark:text-[#22c55e]"
                  aria-hidden="true"
                >
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                <span className="font-medium text-emerald-950 dark:text-slate-100">
                  {t("sale.itemsOnSale")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/95 px-4 py-2 shadow-sm dark:border-[var(--gl-border)] dark:bg-[#2d2610]/90 dark:shadow-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-amber-700 dark:text-[#f5c84c]"
                  aria-hidden="true"
                >
                  <path d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span className="font-medium text-amber-950 dark:text-slate-100">
                  {t("sale.endsSoon")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b border-[var(--gl-border)] bg-[var(--gl-page)]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-xs transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10 5H3" />
                <path d="M12 19H3" />
                <path d="M14 3v4" />
                <path d="M16 17v4" />
                <path d="M21 12h-9" />
                <path d="M21 19h-5" />
                <path d="M21 5h-7" />
                <path d="M8 10v4" />
                <path d="M8 12H3" />
              </svg>
              {t("sale.filters")}
            </button>
            <div className="hidden items-center gap-2 lg:flex" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {products.length} {t("sale.deals")}
            </span>
            <div className="relative">
              <select
                value={selectedSort}
                onChange={(event) =>
                  setSelectedSort(
                    event.target.value as
                      | "DISCOUNT_DESC"
                      | "PRICE_ASC"
                      | "PRICE_DESC"
                      | "RATING_DESC",
                  )
                }
                className="h-8 appearance-none rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 pr-8 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
              >
                <option value="DISCOUNT_DESC">{t("sale.sortDiscount")}</option>
                <option value="PRICE_ASC">{t("sale.sortPriceAsc")}</option>
                <option value="PRICE_DESC">{t("sale.sortPriceDesc")}</option>
                <option value="RATING_DESC">{t("sale.sortRating")}</option>
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <div className="hidden items-center gap-1 border-l border-[var(--gl-border)] pl-2 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-[var(--gl-nav-active-bg)] text-[var(--gl-nav-active-text)]"
                    : "text-slate-800 dark:text-slate-200 hover:bg-[var(--gl-card)]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-[var(--gl-nav-active-bg)] text-[var(--gl-nav-active-text)]"
                    : "text-slate-800 dark:text-slate-200 hover:bg-[var(--gl-card)]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                  <path d="M14 4h7" />
                  <path d="M14 9h7" />
                  <path d="M14 15h7" />
                  <path d="M14 20h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-36 space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                  {t("catalog.category")}
                </h3>
                <div className="space-y-2">
                  {[
                    ["all", "All"],
                    ["Clubs", "Clubs"],
                    ["Bags", "Bags"],
                    ["Balls", "Balls"],
                    ["Apparel", "Apparel"],
                    ["Accessories", "Accessories"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="group flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategory === value}
                        onChange={() =>
                          setSelectedCategory(
                            selectedCategory === value ? "all" : value,
                          )
                        }
                        className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {label === "All"
                          ? t("catalog.all")
                          : t(saleSidebarLabelKeys[label] ?? label)}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        {value === "all"
                          ? `(${allProducts.length})`
                          : `(${categoryCounts[label] ?? 0})`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rose-700/30 bg-rose-900/10 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t("sale.dealHighlightsTitle")}
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li>{t("sale.dealHighlightShipping")}</li>
                  <li>{t("sale.dealHighlightCode")}</li>
                  <li>{t("sale.dealHighlightPriceMatch")}</li>
                  <li>{t("sale.dealHighlightReturns")}</li>
                </ul>
              </div>
            </div>
          </aside>

          <section className="flex-1">
            {loading ? (
              <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center text-slate-600 dark:text-slate-400">
                {t("sale.loading")}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-900 bg-rose-950/20 p-10 text-center text-rose-300">
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {t("sale.emptyTitle")}
                </p>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("sale.emptyBody")}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                }
              >
                {products.map((item) => {
                  const discount = Math.round(
                    ((item.originalPrice - item.salePrice) /
                      item.originalPrice) *
                      100,
                  );
                  const saved = (item.originalPrice - item.salePrice).toFixed(
                    2,
                  );
                  return (
                    <article
                      key={item.id}
                      className={`group relative overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] transition-all duration-300 hover:border-[#22c55e]/30 hover:shadow-lg hover:shadow-[#22c55e]/5 ${
                        viewMode === "list" ? "flex gap-4 p-4" : ""
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden bg-[var(--gl-card)] ${viewMode === "list" ? "h-40 w-40 shrink-0 rounded-xl" : "aspect-square"}`}
                      >
                        <Link
                          to={`/product/${item.id}`}
                          className="absolute inset-0 z-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gl-card)]"
                          aria-label={`View ${item.name}`}
                        >
                          <img
                            src={
                              item.imageUrl ??
                              getProductImageUrl(
                                item.name,
                                `${item.category} golf sale`,
                              )
                            }
                            alt={item.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = "/products/club.jpg";
                            }}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </Link>
                        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                          <span className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                            -{discount}%
                          </span>
                          {item.badge ? (
                            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <WishlistToggleButton
                          itemId={item.id}
                          itemName={item.name}
                          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gl-deep)]/90 backdrop-blur transition-all"
                        />
                        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <button
                            type="button"
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#03210f] transition-colors hover:bg-[#16a34a]"
                          >
                            {t("product.addToCart")}
                          </button>
                        </div>
                      </div>
                      <div
                        className={viewMode === "list" ? "flex-1 py-1" : "p-4"}
                      >
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                          {item.brand}
                        </p>
                        <Link
                          to={`/product/${item.id}`}
                          className="mt-1 line-clamp-2 block font-medium text-slate-900 dark:text-slate-100 hover:text-[var(--gl-accent-text)]"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-2 flex items-center gap-1 text-sm">
                          <span className="text-amber-300">★</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.rating.toFixed(1)}
                          </span>
                          <span className="text-slate-500">
                            ({item.reviewCount})
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-lg font-bold text-rose-400">
                            ${item.salePrice.toFixed(2)}
                          </span>
                          <span className="text-sm text-slate-500 line-through">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[var(--gl-accent-text)]">
                          {t("product.youSave", { amount: saved })}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-12 rounded-2xl border border-[var(--gl-border)] bg-gradient-to-r from-[var(--gl-grad-accent-60)] to-[var(--gl-surface-60)] p-8 text-center">
              <h3 className="text-2xl font-bold text-[var(--gl-heading)]">
                {t("sale.exclusiveAlertsTitle")}
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {t("sale.exclusiveAlertsSub")}
              </p>
              <form
                className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row"
                onSubmit={handleSaleAlertSubscribe}
              >
                <input
                  type="email"
                  placeholder={t("sale.alertEmailPlaceholder")}
                  value={saleAlertEmail}
                  onChange={(event) => {
                    setSaleAlertEmail(event.target.value);
                    if (saleAlertMessage) setSaleAlertMessage(null);
                  }}
                  className="w-full max-w-xs rounded-full border border-[var(--gl-border)] bg-[var(--gl-deep)] px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#042210] transition-colors hover:bg-[#16a34a] sm:w-auto"
                >
                  {t("sale.subscribeButton")}
                </button>
              </form>
              {saleAlertMessage ? (
                <p
                  className={`mt-2 text-sm ${
                    saleAlertMessage.type === "error"
                      ? "text-rose-400"
                      : "text-[var(--gl-accent-text)]"
                  }`}
                >
                  {saleAlertMessage.text}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

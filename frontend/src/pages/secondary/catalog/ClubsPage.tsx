import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { fetchClubProducts } from "../../../lib/catalog-api";
import {
  getProductImageUrl,
  translatePriceFilterLabel,
} from "../../../lib/app-utils";
import { PRICE_FILTER_OPTIONS } from "../../../constants/commerce";
import {
  SiteFooter,
  TopNav,
  WishlistToggleButton,
} from "../../../components/app-frame";
import type { ClubItem } from "../../../types/app";

export default function ClubsPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("FEATURED");
  const [page, setPage] = useState(1);
  const [allClubs, setAllClubs] = useState<ClubItem[]>([]);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const perPage = 9;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allClubs) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allClubs]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allClubs) {
      map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allClubs]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBrand, selectedPrice, sortBy]);

  useEffect(() => {
    fetchClubProducts({ limit: 30, page: 1 }).then((result) => {
      if (result.data) {
        setAllClubs(result.data.items);
      }
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const mapPriceRange = ():
      | "ALL"
      | "UNDER_50"
      | "RANGE_50_100"
      | "RANGE_100_250"
      | "RANGE_250_500"
      | "OVER_500" => {
      if (selectedPrice === "Under $50") return "UNDER_50";
      if (selectedPrice === "$50 - $100") return "RANGE_50_100";
      if (selectedPrice === "$100 - $250") return "RANGE_100_250";
      if (selectedPrice === "$250 - $500") return "RANGE_250_500";
      if (selectedPrice === "Over $500") return "OVER_500";
      return "ALL";
    };

    fetchClubProducts({
      category: selectedCategory,
      search: searchQuery,
      brand: selectedBrand,
      priceRange: mapPriceRange(),
      sort: sortBy,
      page,
      limit: perPage,
    }).then((result) => {
      if (result.error || !result.data) {
        setError(result.error ?? t("catalog.failedClubs"));
        setClubs([]);
        setTotal(0);
      } else {
        setClubs(result.data.items);
        setTotal(result.data.total);
      }
      setLoading(false);
    });
  }, [
    selectedCategory,
    selectedBrand,
    selectedPrice,
    sortBy,
    page,
    searchQuery,
    t,
  ]);

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <div className="sticky top-0 z-40">
        <TopNav
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("search.placeholderNav")}
        />
      </div>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#22c55e]/20 via-[var(--gl-page)] to-[var(--gl-page)] py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
              {t("clubs.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              {t("clubs.sub")}
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>{t("catalog.products", { count: total })}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-12 z-30 border-b border-[var(--gl-border)] bg-[var(--gl-page)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-xs transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                {t("catalog.filters")}
              </button>
              <div className="hidden items-center gap-2 lg:flex" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as
                        | "FEATURED"
                        | "PRICE_ASC"
                        | "PRICE_DESC"
                        | "RATING_DESC",
                    )
                  }
                  className="h-8 appearance-none rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 pr-8 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <option value="FEATURED">{t("catalog.featured")}</option>
                  <option value="PRICE_ASC">{t("catalog.priceAsc")}</option>
                  <option value="PRICE_DESC">{t("catalog.priceDesc")}</option>
                  <option value="RATING_DESC">{t("catalog.ratingDesc")}</option>
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
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-36 space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                  {t("catalog.category")}
                </h3>
                <div className="space-y-2">
                  {categories.map(([name, count]) => (
                    <label
                      key={name}
                      className="group flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategory === name}
                        onChange={() =>
                          setSelectedCategory(
                            selectedCategory === name ? "All" : name,
                          )
                        }
                        className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {name}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        ({count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                  {t("catalog.brand")}
                </h3>
                <div className="space-y-2">
                  {brands.map(([name, count]) => (
                    <label
                      key={name}
                      className="group flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrand === name}
                        onChange={() =>
                          setSelectedBrand(
                            selectedBrand === name ? "All" : name,
                          )
                        }
                        className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {name}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        ({count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                  {t("catalog.priceRange")}
                </h3>
                <div className="space-y-2">
                  {PRICE_FILTER_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="group flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="club-price"
                        checked={selectedPrice === option}
                        onChange={() => setSelectedPrice(option)}
                        className="h-4 w-4 border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                        {translatePriceFilterLabel(option, t)}
                      </span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedPrice("All")}
                    className="mt-1 text-xs text-[var(--gl-accent-text)] hover:text-[#88f7b4]"
                  >
                    {t("catalog.clearPrice")}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center text-slate-600 dark:text-slate-400">
                {t("catalog.loadingClubs")}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-900 bg-rose-950/20 p-10 text-center text-rose-300">
                {error}
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                }
              >
                {clubs.map((item) => {
                  const safeRating =
                    typeof item.rating === "number" ? item.rating : 0;
                  const safeReviews =
                    typeof item.reviewCount === "number" ? item.reviewCount : 0;
                  const safePrice =
                    typeof item.price === "number" ? item.price : 0;
                  const hasOriginalPrice =
                    typeof item.originalPrice === "number";
                  return (
                    <article
                      key={item.id}
                      className={`group relative overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] transition-all duration-300 hover:border-[#22c55e]/30 hover:shadow-lg hover:shadow-[#22c55e]/5 ${
                        viewMode === "list" ? "flex gap-4 p-4" : ""
                      }`}
                    >
                      <div
                        className={`relative overflow-hidden bg-[var(--gl-card)] ${
                          viewMode === "list"
                            ? "h-40 w-40 shrink-0 rounded-xl"
                            : "aspect-square"
                        }`}
                      >
                        <Link
                          to={`/product/${item.id}`}
                          className="absolute inset-0 z-0 block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gl-card)]"
                          aria-label={t("common.viewProduct", {
                            name: item.name,
                          })}
                        >
                          <img
                            src={
                              item.imageUrl ??
                              getProductImageUrl(
                                item.name,
                                `${item.category} golf club`,
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
                        {item.badge ? (
                          <div className="absolute left-3 top-3 z-10">
                            <span className="rounded-md bg-[#22c55e]/20 px-2 py-0.5 text-xs font-medium text-[var(--gl-accent-text)]">
                              {item.badge}
                            </span>
                          </div>
                        ) : null}
                        <WishlistToggleButton
                          itemId={item.id}
                          itemName={item.name}
                          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gl-deep)]/90 backdrop-blur transition-all"
                        />
                        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <button
                            type="button"
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#062412]"
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
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {safeRating.toFixed(1)} ({safeReviews})
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            ${safePrice.toFixed(2)}
                          </span>
                          {hasOriginalPrice ? (
                            <span className="text-sm text-slate-500 line-through">
                              ${item.originalPrice!.toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
              >
                {t("catalog.previous")}
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 3) }).map(
                  (_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPage(value)}
                        className={`h-8 w-9 rounded-md text-sm ${
                          page === value
                            ? "bg-[var(--gl-nav-active-bg)] text-[var(--gl-nav-active-text)]"
                            : "text-slate-800 dark:text-slate-200 hover:bg-[var(--gl-card)]"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  },
                )}
                {totalPages > 4 ? (
                  <span className="px-2 text-slate-500">...</span>
                ) : null}
                {totalPages > 3 ? (
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className="h-8 w-9 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-[var(--gl-card)]"
                  >
                    {totalPages}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 text-sm text-slate-600 dark:text-slate-400 disabled:opacity-50"
              >
                {t("catalog.next")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

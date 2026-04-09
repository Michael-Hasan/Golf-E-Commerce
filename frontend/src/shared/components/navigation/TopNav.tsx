import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLang } from "../../../i18n";
import { useTheme } from "../../../theme-context";
import { useIsAuthenticated } from "../../../lib/app-utils";
import {
  notifyCartChanged,
  persistCartItems,
  persistWishlistIds,
  readCartItems,
  readWishlistIds,
} from "../../../lib/app-utils";
import {
  fetchAccessoryProducts,
  fetchApparelProducts,
  fetchBagProducts,
  fetchBallProducts,
  fetchClubProducts,
  fetchSaleProducts,
} from "../../../lib/catalog-api";
import {
  SiteNavDesktop,
  SiteNavMobileDrawer,
} from "../../../components/SiteNav";
import { CART_CHANGED_EVENT, CART_KEY } from "../../../config/app-config";
import type { CartItem } from "../../../types/app";
import { TopNavControls } from "./TopNavControls";
import { TopNavSearch } from "./TopNavSearch";

type TopNavProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

export function TopNav({
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: TopNavProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isUzHeader = normalizeLang(i18n.language) === "uz";
  const isKoHeader = normalizeLang(i18n.language) === "ko";
  const placeholder = searchPlaceholder ?? t("search.placeholderNav");
  const isAuthenticated = useIsAuthenticated();
  const [activePanel, setActivePanel] = useState<"wishlist" | "cart" | null>(
    null,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<
    Array<{
      id: string;
      brand: string;
      name: string;
      price: number;
      originalPrice?: number;
      path: string;
    }>
  >([]);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCartItems());

  useEffect(() => {
    const syncWishlist = async () => {
      const [
        clubsResult,
        ballsResult,
        bagsResult,
        apparelResult,
        accessoriesResult,
        saleResult,
      ] = await Promise.all([
        fetchClubProducts({ limit: 30, page: 1 }),
        fetchBallProducts({ limit: 30, page: 1 }),
        fetchBagProducts({ limit: 30, page: 1 }),
        fetchApparelProducts({ limit: 30, page: 1 }),
        fetchAccessoryProducts({ limit: 30, page: 1 }),
        fetchSaleProducts("all", "DISCOUNT_DESC"),
      ]);

      const catalog = new Map<
        string,
        {
          id: string;
          brand: string;
          name: string;
          price: number;
          originalPrice?: number;
          path: string;
        }
      >();

      for (const item of clubsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          path: "/clubs",
        });
      }
      for (const item of ballsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          path: "/balls",
        });
      }
      for (const item of bagsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          path: "/bags",
        });
      }
      for (const item of apparelResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          path: "/apparel",
        });
      }
      for (const item of accessoriesResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          path: "/accessories",
        });
      }
      for (const item of saleResult.data ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.salePrice,
          originalPrice: item.originalPrice,
          path: "/sale",
        });
      }

      const ids = readWishlistIds();
      const hydrated = ids
        .map((id) => catalog.get(id))
        .filter(Boolean) as Array<{
        id: string;
        brand: string;
        name: string;
        price: number;
        originalPrice?: number;
        path: string;
      }>;
      setWishlistItems(hydrated);
    };

    const onWishlistChanged = () => {
      void syncWishlist();
    };

    void syncWishlist();
    window.addEventListener(
      "wishlist:changed",
      onWishlistChanged as EventListener,
    );
    window.addEventListener("storage", onWishlistChanged);
    return () => {
      window.removeEventListener(
        "wishlist:changed",
        onWishlistChanged as EventListener,
      );
      window.removeEventListener("storage", onWishlistChanged);
    };
  }, []);

  useEffect(() => {
    const syncCart = () => {
      setCartItems(readCartItems());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) syncCart();
    };

    syncCart();
    window.addEventListener(CART_CHANGED_EVENT, syncCart as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, syncCart as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!activePanel && !mobileNavOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [activePanel, mobileNavOpen]);

  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;
  const removeFromWishlistPanel = (id: string) => {
    const nextIds = readWishlistIds().filter((wishlistId) => wishlistId !== id);
    persistWishlistIds(nextIds);
    window.dispatchEvent(new Event("wishlist:changed"));
  };
  const clearWishlistPanel = () => {
    persistWishlistIds([]);
    window.dispatchEvent(new Event("wishlist:changed"));
  };
  const updateCartItems = (updater: (items: CartItem[]) => CartItem[]) => {
    setCartItems((items) => {
      const next = updater(items);
      persistCartItems(next);
      notifyCartChanged();
      return next;
    });
  };
  const incrementCartItem = (id: string) => {
    updateCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };
  const decrementCartItem = (id: string) => {
    updateCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item,
      ),
    );
  };
  const removeCartItem = (id: string) => {
    updateCartItems((items) => items.filter((item) => item.id !== id));
  };
  const clearCartItems = () => {
    updateCartItems(() => []);
  };
  const openWishlistProduct = (item: { id: string }) => {
    setActivePanel(null);
    navigate(`/product/${item.id}`);
  };

  return (
    <>
      <SiteNavMobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <header className="sticky top-0 z-40 w-full overflow-visible border-b border-[var(--gl-header-border)] bg-[var(--gl-header-bg)] backdrop-blur">
        <div className="mx-auto max-w-7xl overflow-visible px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[4.25rem] items-center justify-between gap-2 overflow-visible py-1.5 sm:gap-3 sm:py-2 lg:min-h-16 lg:gap-4 lg:py-0">
            <Link to="/" className="flex shrink-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]">
                <span className="text-base font-bold text-[#042210]">G</span>
              </div>
              <span className="hidden font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:block">
                GreenLinks
              </span>
            </Link>

            <nav
              className="relative z-[45] hidden min-h-0 min-w-0 flex-1 items-stretch overflow-visible py-1 lg:flex lg:justify-center lg:px-1"
              aria-label="Primary"
            >
              <SiteNavDesktop isUzHeader={isUzHeader} isKoHeader={isKoHeader} />
            </nav>

            <TopNavSearch
              value={searchValue}
              onChange={onSearchChange}
              placeholder={placeholder}
              isUzHeader={isUzHeader}
              containerClassName="hidden shrink-0 lg:mr-1 lg:block"
            />

            <TopNavControls
              t={t}
              theme={theme}
              toggleTheme={toggleTheme}
              language={normalizeLang(i18n.language)}
              onLanguageChange={(value) => {
                void i18n.changeLanguage(value);
              }}
              isUzHeader={isUzHeader}
              isAuthenticated={isAuthenticated}
              wishlistCount={wishlistCount}
              cartItemCount={cartItemCount}
              onWishlistOpen={() => {
                setMobileNavOpen(false);
                setActivePanel("wishlist");
              }}
              onCartOpen={() => {
                setMobileNavOpen(false);
                setActivePanel("cart");
              }}
              onMobileNavOpen={() => setMobileNavOpen(true)}
            />
          </div>
        </div>
      </header>
      {activePanel ? (
        <>
          <button
            type="button"
            aria-label={t("a11y.closePanelBackdrop")}
            onClick={() => setActivePanel(null)}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--gl-border)] bg-[var(--gl-drawer)] shadow-2xl">
            {activePanel === "wishlist" ? (
              <>
                <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-6 py-4">
                  <div className="flex items-center gap-2">
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
                      className="h-5 w-5 text-[#22c55e]"
                      aria-hidden="true"
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                    <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("drawer.wishlist")}
                    </h2>
                    {wishlistCount > 0 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-xs font-medium text-[#042210]">
                        {wishlistCount}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    className="inline-flex size-9 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {wishlistItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-600 dark:text-slate-400">
                      {t("drawer.emptyWishlist")}
                    </div>
                  ) : (
                    <ul className="divide-y divide-[var(--gl-border)]">
                      {wishlistItems.map((item) => (
                        <li key={item.id} className="p-4">
                          <div className="flex gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--gl-card)]">
                              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-500/40">
                                {item.brand[0]}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                {item.brand}
                              </p>
                              <button
                                type="button"
                                onClick={() => openWishlistProduct(item)}
                                className="mt-0.5 line-clamp-2 text-left font-medium text-slate-900 dark:text-slate-100 transition-colors hover:text-[var(--gl-accent-text)]"
                              >
                                {item.name}
                              </button>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  ${item.price.toFixed(2)}
                                </span>
                                {typeof item.originalPrice === "number" ? (
                                  <span className="text-sm text-slate-500 line-through">
                                    ${item.originalPrice.toFixed(2)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#22c55e] px-3 text-xs font-medium text-[#042210] hover:bg-[#33d06b]"
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
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  >
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                    <path d="M3.103 6.034h17.794" />
                                    <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                                  </svg>
                                  {t("drawer.addToCart")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromWishlistPanel(item.id)
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-rose-400"
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
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t border-[var(--gl-border)] p-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearWishlistPanel}
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--gl-border-accent)] bg-[var(--gl-surface)] px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-raised2)]"
                    >
                      {t("drawer.clearAll")}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#042210] transition-all hover:bg-[#33d06b]"
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
                        <path d="M16 10a4 4 0 0 1-8 0" />
                        <path d="M3.103 6.034h17.794" />
                        <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                      </svg>
                      {t("drawer.addAllToCart")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[var(--gl-border)] px-6 py-4">
                  <div className="flex items-center gap-2">
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
                      className="h-5 w-5 text-[#22c55e]"
                      aria-hidden="true"
                    >
                      <path d="M16 10a4 4 0 0 1-8 0" />
                      <path d="M3.103 6.034h17.794" />
                      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                    </svg>
                    <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("drawer.cart")}
                    </h2>
                    {cartItemCount > 0 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22c55e] text-xs font-medium text-[#042210]">
                        {cartItemCount}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    className="inline-flex size-9 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {cartItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-600 dark:text-slate-400">
                      {t("drawer.emptyCart")}
                    </div>
                  ) : (
                    <ul className="divide-y divide-[var(--gl-border)]">
                      {cartItems.map((item) => (
                        <li key={item.id} className="p-4">
                          <div className="flex items-start gap-4">
                            <Link
                              to={`/product/${encodeURIComponent(item.id)}`}
                              className="flex min-w-0 flex-1 gap-4 rounded-lg outline-none transition hover:bg-[var(--gl-hover)]/50 focus-visible:ring-2 focus-visible:ring-[#22c55e]/50 -m-1 p-1"
                            >
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--gl-card)]">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                      event.currentTarget.src =
                                        "/products/club.jpg";
                                    }}
                                  />
                                ) : (
                                  <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-500/40">
                                    {item.brand[0]}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                  {item.brand}
                                </p>
                                <h4 className="mt-0.5 line-clamp-2 font-medium text-slate-900 dark:text-slate-100">
                                  {item.name}
                                </h4>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    ${item.price.toFixed(2)}
                                  </span>
                                  {typeof item.originalPrice === "number" &&
                                  item.originalPrice > item.price ? (
                                    <span className="text-sm text-slate-500 line-through">
                                      ${item.originalPrice.toFixed(2)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </Link>
                            <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => decrementCartItem(item.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  >
                                    <path d="M5 12h14" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => incrementCartItem(item.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  >
                                    <path d="M5 12h14" />
                                    <path d="M12 5v14" />
                                  </svg>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCartItem(item.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-rose-400"
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
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="border-t border-[var(--gl-border)] p-4">
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {t("drawer.subtotal")}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {t("drawer.shipping")}
                      </span>
                      <span className="font-medium text-[#22c55e]">
                        {t("drawer.free")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--gl-border)] pt-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {t("drawer.total")}
                      </span>
                      <span className="text-lg font-bold text-[#22c55e]">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={clearCartItems}
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--gl-border-accent)] bg-[var(--gl-surface)] px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-raised2)]"
                      >
                        {t("drawer.clearAll")}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#042210] transition-all hover:bg-[#33d06b]"
                      >
                        {t("drawer.viewCart")}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-hover)]"
                    >
                      {t("drawer.checkout")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </>
      ) : null}
    </>
  );
}

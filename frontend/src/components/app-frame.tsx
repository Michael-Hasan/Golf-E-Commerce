import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLang } from "../i18n";
import { useTheme } from "../theme-context";
import { SiteNavDesktop, SiteNavMobileDrawer } from "./SiteNav";
import {
  addItemToCart,
  centerOfElement,
  getProductImageUrl,
  isValidEmail,
  notifyCartChanged,
  persistCartItems,
  persistWishlistIds,
  readCartItems,
  readStoredToken,
  readWishlistIds,
  saveNewsletterEmail,
  translatePriceFilterLabel,
} from "../lib/app-utils";
import {
  fetchAccessoryProducts,
  fetchApparelProducts,
  fetchBagProducts,
  fetchBallProducts,
  fetchClubProducts,
  fetchSaleProducts,
} from "../lib/catalog-api";
import {
  CART_CHANGED_EVENT,
  CART_KEY,
} from "../config/app-config";
import type { CartItem } from "../types/app";

function ProductImage({
  name,
  category,
  imgClassName,
}: {
  name: string;
  category?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="mb-3 flex h-36 items-center justify-center rounded-lg bg-[var(--gl-card)] text-3xl font-semibold text-slate-500">
        {name[0]}
      </div>
    );
  }

  return (
    <img
      src={getProductImageUrl(name, category)}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={
        imgClassName ??
        "mb-3 h-36 w-full rounded-lg border border-[var(--gl-border-strong)] object-cover"
      }
    />
  );
}

function WishlistToggleButton({
  itemId,
  itemName,
  className,
  children,
  creativeOnLike,
}: {
  itemId: string;
  itemName: string;
  className?: string;
  children?: React.ReactNode;
  creativeOnLike?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setLiked(readWishlistIds().includes(itemId));
  }, [itemId]);

  useEffect(() => {
    if (!creativeOnLike || !liked) return;
    setPop(true);
    const t = window.setTimeout(() => setPop(false), 650);
    return () => window.clearTimeout(t);
  }, [creativeOnLike, liked]);

  const toggleWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setLiked((current) => {
      const ids = readWishlistIds();
      const nextIds = current
        ? ids.filter((id) => id !== itemId)
        : Array.from(new Set([...ids, itemId]));
      persistWishlistIds(nextIds);
      window.dispatchEvent(new Event("wishlist:changed"));
      return !current;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      aria-label={`${liked ? "Remove" : "Add"} ${itemName} ${liked ? "from" : "to"} wishlist`}
      aria-pressed={liked}
      className={`${className ?? ""} ${
        creativeOnLike ? "relative overflow-hidden" : ""
      } ${
        liked
          ? creativeOnLike
            ? "bg-gradient-to-r from-rose-500/20 via-fuchsia-500/10 to-pink-500/10 text-rose-200 ring-1 ring-rose-500/35"
            : "bg-rose-500/20 text-rose-400"
          : "text-slate-600 transition-colors hover:text-[#22c55e] dark:text-slate-300 dark:hover:text-[#22c55e]"
      }`}
    >
      {creativeOnLike ? (
        <>
          {liked && pop ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl wishlist-like-ring"
            />
          ) : null}
          {liked && pop ? (
            <>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "-18px", ["--dy" as any]: "-24px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "16px", ["--dy" as any]: "-18px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "-20px", ["--dy" as any]: "10px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "20px", ["--dy" as any]: "14px" } as any}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute wishlist-burst-dot"
                style={{ ["--dx" as any]: "0px", ["--dy" as any]: "-30px" } as any}
              />
            </>
          ) : null}
        </>
      ) : null}
      <span className="flex items-center justify-center gap-2">
        <span className="text-lg leading-none" aria-hidden="true">
          <span
            className={
              creativeOnLike && liked && pop
                ? "wishlist-like-heart-pulse"
                : undefined
            }
          >
            {liked ? "♥" : "♡"}
          </span>
        </span>
        {children ? (
          <span className="text-sm font-bold tracking-tight">{children}</span>
        ) : null}
      </span>
    </button>
  );
}

type TopNavProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

function TopNav({
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
  const isAuthenticated = Boolean(readStoredToken());
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

            <div
              className={`hidden shrink-0 lg:mr-1 lg:block ${isUzHeader ? "w-[min(100%,16rem)] min-w-[12rem] max-w-[42vw] sm:w-[15rem] xl:w-[17rem] 2xl:w-[18rem]" : "w-[min(100%,14rem)] min-w-[10.5rem] max-w-[36vw] sm:w-[13.5rem] xl:w-[15rem] 2xl:w-[16rem]"}`}
            >
              <div className="relative lg:-translate-x-1">
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
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                >
                  <path d="m21 21-4.34-4.34" />
                  <circle cx="11" cy="11" r="8" />
                </svg>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={placeholder}
                  className="h-9 w-full min-w-0 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-input-bg)] py-1.5 pl-10 pr-3 text-sm text-slate-900 dark:text-slate-100 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-slate-500 placeholder:leading-normal focus-visible:border-[#2a5f45] focus-visible:ring-[3px] focus-visible:ring-[#2a5f45]/30"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex size-8 items-center justify-center rounded-md text-slate-600 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                aria-label={
                  theme === "dark"
                    ? t("theme.toLight")
                    : t("theme.toDark")
                }
                title={
                  theme === "dark"
                    ? t("theme.light")
                    : t("theme.dark")
                }
              >
                {theme === "dark" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </button>
              <label className="sr-only" htmlFor="gl-lang-select">
                {t("a11y.language")}
              </label>
              <select
                id="gl-lang-select"
                value={normalizeLang(i18n.language)}
                onChange={(event) => {
                  void i18n.changeLanguage(event.target.value);
                }}
                className="h-9 min-w-[6rem] w-max max-w-none rounded-md border border-[var(--gl-border)] bg-[var(--gl-input-bg)] px-2 text-xs font-medium leading-normal text-slate-700 outline-none dark:text-slate-300"
              >
                <option value="en">{t("lang.en")}</option>
                <option value="ko">{t("lang.ko")}</option>
                <option value="uz">{t("lang.uz")}</option>
              </select>
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
                      <path d="m21 21-4.34-4.34" />
                      <circle cx="11" cy="11" r="8" />
                    </svg>
                    <span className="sr-only">{t("a11y.search")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      setActivePanel("wishlist");
                    }}
                    className="relative hidden size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 sm:flex"
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
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                    {wishlistCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22c55e] px-1 text-[10px] font-bold text-[#042210]">
                        {wishlistCount}
                      </span>
                    ) : null}
                    <span className="sr-only">{t("a11y.wishlist")}</span>
                  </button>

                  <Link
                    to="/my-page"
                    className="hidden size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 sm:flex"
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
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="sr-only">{t("a11y.account")}</span>
                  </Link>

                  <button
                    type="button"
                    data-cart-fly-target
                    onClick={() => {
                      setMobileNavOpen(false);
                      setActivePanel("cart");
                    }}
                    className="relative inline-flex size-8 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
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
                      <path d="M16 10a4 4 0 0 1-8 0" />
                      <path d="M3.103 6.034h17.794" />
                      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                    </svg>
                    {cartItemCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#22c55e] px-1 text-[10px] font-bold text-[#042210]">
                        {cartItemCount}
                      </span>
                    ) : null}
                    <span className="sr-only">{t("a11y.cart")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="inline-flex size-8 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
                      <path d="M4 5h16" />
                      <path d="M4 12h16" />
                      <path d="M4 19h16" />
                    </svg>
                    <span className="sr-only">{t("a11y.menu")}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    className="inline-flex size-8 items-center justify-center rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 transition-all hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
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
                      <path d="M4 5h16" />
                      <path d="M4 12h16" />
                      <path d="M4 19h16" />
                    </svg>
                    <span className="sr-only">{t("a11y.menu")}</span>
                  </button>
                <Link
                  to="/auth"
                  title={t("nav.loginSignupFull")}
                  className={`inline-flex items-center justify-center rounded-md border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-3 py-2 text-center font-medium leading-snug text-slate-900 dark:text-slate-100 transition-all hover:bg-[var(--gl-raised)] ${
                    isUzHeader
                      ? "w-full min-w-0 max-w-[13.5rem] whitespace-normal break-words text-xs [overflow-wrap:anywhere] sm:max-w-[15rem] sm:text-sm lg:w-auto lg:max-w-[17rem] xl:max-w-[19rem]"
                      : "max-w-[min(20rem,calc(100vw-7rem))] break-words text-xs [overflow-wrap:anywhere] sm:max-w-[min(22rem,calc(100vw-8rem))] sm:text-sm lg:max-w-[min(26rem,calc(100vw-12rem))]"
                  }`}
                >
                  {t("nav.loginSignup")}
                </Link>
                </>
              )}
            </div>
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
                      <span className="text-slate-600 dark:text-slate-400">{t("drawer.subtotal")}</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">{t("drawer.shipping")}</span>
                      <span className="font-medium text-[#22c55e]">{t("drawer.free")}</span>
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

function SiteFooter() {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();

    if (!isValidEmail(email)) {
      setNewsletterMessage({
        type: "error",
        text: t("footer.invalidEmail"),
      });
      return;
    }

    const status = saveNewsletterEmail(email);
    setNewsletterMessage({
      type: "success",
      text:
        status === "exists"
          ? t("footer.subscribeExists")
          : t("footer.subscribeOk"),
    });
    setNewsletterEmail("");
  };

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

            <div className="mt-6">
              <p className="text-sm font-medium text-[var(--gl-heading)]">
                {t("footer.newsletterTitle")}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("footer.newsletterHint")}
              </p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={handleNewsletterSubmit}
              >
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  value={newsletterEmail}
                  onChange={(event) => {
                    setNewsletterEmail(event.target.value);
                    if (newsletterMessage) setNewsletterMessage(null);
                  }}
                  className="h-9 w-full flex-1 rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 outline-none transition-[color,box-shadow] focus:border-[#2a5f45] focus:ring-[3px] focus:ring-[#2a5f45]/30"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#22c55e] px-4 py-2 text-sm font-medium text-[#062412] transition-all hover:bg-[#33d06b]"
                >
                  {t("footer.subscribe")}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </form>
              {newsletterMessage ? (
                <p
                  className={`mt-2 text-xs ${
                    newsletterMessage.type === "error"
                      ? "text-rose-400"
                      : "text-[var(--gl-accent-text)]"
                  }`}
                >
                  {newsletterMessage.text}
                </p>
              ) : null}
            </div>

            <div className="mt-8 flex gap-4">
              {[
                {
                  label: "Instagram",
                  href: "https://www.instagram.com/greenlinksgolf/",
                  icon: (
                    <>
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </>
                  ),
                },
                {
                  label: "Twitter",
                  href: "/",
                  icon: (
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  ),
                },
                {
                  label: "Facebook",
                  href: "/",
                  icon: (
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  ),
                },
                {
                  label: "YouTube",
                  href: "/",
                  icon: (
                    <>
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </>
                  ),
                },
              ].map((social) => {
                const icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    {social.icon}
                  </svg>
                );

                const className =
                  "flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gl-surface)] text-slate-900 dark:text-slate-100 transition-colors hover:bg-[#22c55e] hover:text-[#062412]";

                return social.href.startsWith("http") ? (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    aria-label={social.label}
                  >
                    {icon}
                  </a>
                ) : (
                  <Link
                    key={social.label}
                    to={social.href}
                    className={className}
                    aria-label={social.label}
                  >
                    {icon}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {(
              [
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
              ] as const
            ).map((group) => (
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
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--gl-border)] pt-8 sm:flex-row">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t("footer.copyright")}
          </p>
          <div className="flex gap-6">
            <Link
              to="/"
              className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to="/"
              className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
            >
              {t("footer.terms")}
            </Link>
            <Link
              to="/"
              className="text-sm text-slate-600 dark:text-slate-400 transition-colors hover:text-[var(--gl-accent-text)]"
            >
              {t("footer.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { ProductImage, WishlistToggleButton, TopNav, SiteFooter };

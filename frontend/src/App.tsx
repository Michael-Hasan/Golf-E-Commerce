import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { useTranslation } from "react-i18next";
import { normalizeLang } from "./i18n";
import {
  addItemToCart,
  buildGoogleMapsNearbySearchUrl,
  buildOpenStreetMapEmbedUrl,
  centerOfElement,
  clearToken,
  extractCartItemFromButton,
  fetchNearbyGolfShopsWithRetry,
  formatProductCount,
  getChatIdentityFromToken,
  getProductImageUrl,
  isValidEmail,
  notifyCartChanged,
  openGreenlinksAiAssistant,
  persistAiHistory,
  persistCartItems,
  persistHiddenChatMessageIds,
  persistToken,
  persistUnreadChatCount,
  persistWishlistIds,
  readAiHistory,
  readCartItems,
  readHiddenChatMessageIds,
  readUnreadChatCount,
  readWishlistIds,
  saveNewsletterEmail,
  translatePriceFilterLabel,
  useIsAuthenticated,
} from "./lib/app-utils";
import {
  adminCreateCatalogProduct,
  adminDeleteCatalogProduct,
  adminUpdateCatalogProduct,
  adminUpdateUserRole,
  callAuthMutation,
  callGraphql,
  fetchAccessoryProducts,
  fetchAdminCatalogProducts,
  fetchAdminUsers,
  fetchApparelProducts,
  fetchBagProducts,
  fetchBallProducts,
  fetchBrandCount,
  fetchClubProducts,
  fetchFeaturedProducts,
  fetchMyPage,
  fetchProductById,
  fetchSaleProducts,
  placeOrder,
  updateMyProfile,
  uploadAdminProductImage,
} from "./lib/catalog-api";
import type {
  GreenlinksAiOpenDetail,
  NearbyGolfShop,
} from "./lib/app-utils";
import type { AdminCatalogProduct, AdminUser } from "./lib/catalog-api";
import { useTheme } from "./theme-context";
import { SiteNavDesktop, SiteNavMobileDrawer } from "./components/SiteNav";
import {
  ProductImage,
  SiteFooter,
  TopNav,
  WishlistToggleButton,
} from "./components/app-frame";
import {
  AI_CHAT_ENDPOINT,
  AI_PROJECT_INFO_ENDPOINT,
  CART_CHANGED_EVENT,
  CART_FLY_EVENT,
  CART_KEY,
  CHAT_WS_ENDPOINT,
  GREENLINKS_AI_OPEN_EVENT,
  WISHLIST_KEY,
} from "./config/app-config";
import { PRICE_FILTER_OPTIONS } from "./constants/commerce";
import { CITY_OPTIONS_BY_COUNTRY, COUNTRY_OPTIONS } from "./constants/locations";
import AboutPageView from "./pages/AboutPageView";
import CompanyMarketingPageView from "./pages/CompanyMarketingPageView";
import SupportPageView from "./pages/SupportPageView";
import type { CompanyPageSlug } from "./pages/company/company-page-slugs";
import type { SupportPageSlug } from "./pages/support/support-page-slugs";
import type {
  AccessoryItem,
  AiPanelMessage,
  ApparelItem,
  BagItem,
  BallItem,
  CartFlyOrigin,
  CartItem,
  ChatIdentity,
  ChatMessage,
  CheckoutOrderResult,
  ClubItem,
  Mode,
  MyPageData,
  PlaceOrderInput,
  ProductDetailData,
  SaleItem,
  User,
  UserRole,
} from "./types/app";

const lazyNamed = <T extends object, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) =>
  lazy(async () => {
    const mod = await loader();
    return { default: mod[key] as React.ComponentType<any> };
  });

const loadSecondaryPages = () => import("./pages/secondary-pages");
const AuthPage = lazyNamed(loadSecondaryPages, "AuthPage");
const MyPage = lazyNamed(loadSecondaryPages, "MyPage");
const SalePage = lazyNamed(loadSecondaryPages, "SalePage");
const ClubsPage = lazyNamed(loadSecondaryPages, "ClubsPage");
const BallsPage = lazyNamed(loadSecondaryPages, "BallsPage");
const BagsPage = lazyNamed(loadSecondaryPages, "BagsPage");
const ApparelPage = lazyNamed(loadSecondaryPages, "ApparelPage");
const AccessoriesPage = lazyNamed(loadSecondaryPages, "AccessoriesPage");
const WishlistPage = lazyNamed(loadSecondaryPages, "WishlistPage");
const ProductDetailPage = lazyNamed(loadSecondaryPages, "ProductDetailPage");
const CartPage = lazyNamed(loadSecondaryPages, "CartPage");
const CheckoutPage = lazyNamed(loadSecondaryPages, "CheckoutPage");
const AdminPage = lazyNamed(loadSecondaryPages, "AdminPage");
const AdminProductsPage = lazyNamed(loadSecondaryPages, "AdminProductsPage");
const CompanyShell = lazyNamed(loadSecondaryPages, "CompanyShell");
const SupportShell = lazyNamed(loadSecondaryPages, "SupportShell");
const AboutPage = lazyNamed(loadSecondaryPages, "AboutPage");
const CartFlyOverlay = lazyNamed(loadSecondaryPages, "CartFlyOverlay");
const RouteActionBridge = lazyNamed(loadSecondaryPages, "RouteActionBridge");
const ChatWidget = lazyNamed(loadSecondaryPages, "ChatWidget");
const AiAssistantWidget = lazyNamed(loadSecondaryPages, "AiAssistantWidget");

function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = useIsAuthenticated();
  const accountPath = isAuthenticated ? "/my-page" : "/auth";
  const [featured, setFeatured] = useState<ClubItem[]>([]);
  const [spotlightBall, setSpotlightBall] = useState<BallItem | null>(null);
  const [spotlightBag, setSpotlightBag] = useState<BagItem | null>(null);
  const [spotlightAccessory, setSpotlightAccessory] =
    useState<AccessoryItem | null>(null);
  const [totalProductCount, setTotalProductCount] = useState<number | null>(null);
  const [brandCount, setBrandCount] = useState<number | null>(null);
  const [homeCategoryCounts, setHomeCategoryCounts] = useState({
    drivers: null as number | null,
    irons: null as number | null,
    putters: null as number | null,
    balls: null as number | null,
    bags: null as number | null,
    apparel: null as number | null,
  });
  const [homeSearch, setHomeSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "clubs" | "balls" | "bags" | "accessories"
  >("all");

  type TrustModalKey = "ship" | "pay" | "returns" | "support";
  const [trustModal, setTrustModal] = useState<TrustModalKey | null>(null);
  const [legendsVideoModalOpen, setLegendsVideoModalOpen] = useState(false);
  const [golfShopModalOpen, setGolfShopModalOpen] = useState(false);
  const [golfShopMapCenter, setGolfShopMapCenter] = useState<
    [number, number] | null
  >(null);
  const [nearbyGolfShops, setNearbyGolfShops] = useState<NearbyGolfShop[]>([]);
  const [golfShopMapLoading, setGolfShopMapLoading] = useState(false);
  const [golfShopMapError, setGolfShopMapError] = useState<string | null>(null);
  const [heroMousePos, setHeroMousePos] = useState({ x: 50, y: 50 });
  const nearbyGolfShopPreview = nearbyGolfShops.slice(0, 3);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHeroMousePos({ x, y });
  };

  const legendsCards = [
    ["Tiger Woods", "15 Majors", "/legends/tiger-woods.jpg"],
    ["Rory McIlroy", "4 Majors", "/legends/rory-mcilroy.jpg"],
    ["Jordan Spieth", "3 Majors", "/legends/jordan-spieth.jpg"],
    ["Scottie Scheffler", "World #1", "/legends/scottie-scheffler.jpg"],
    ["Jon Rahm", "2 Majors", "/legends/jon-rahm.jpg"],
    ["Brooks Koepka", "5 Majors", "/legends/brooks-koepka.jpg"],
  ] as const;
  const trustModalCopy: Record<
    TrustModalKey,
    { titleKey: string; subKey: string; bodyKey: string }
  > = {
    ship: {
      titleKey: "home.trustShipTitle",
      subKey: "home.trustShipSub",
      bodyKey: "home.trustShipInfo",
    },
    pay: {
      titleKey: "home.trustPayTitle",
      subKey: "home.trustPaySub",
      bodyKey: "home.trustPayInfo",
    },
    returns: {
      titleKey: "home.trustReturnsTitle",
      subKey: "home.trustReturnsSub",
      bodyKey: "home.trustReturnsInfo",
    },
    support: {
      titleKey: "home.trustSupportTitle",
      subKey: "home.trustSupportSub",
      bodyKey: "home.trustSupportInfo",
    },
  };

  const trustModalIcon: Record<TrustModalKey, string> = {
    ship: "🚚",
    pay: "🔒",
    returns: "↩️",
    support: "🎧",
  };

  useEffect(() => {
    if (!golfShopModalOpen) {
      return;
    }

    let cancelled = false;

    const loadNearbyGolfShops = async () => {
      setGolfShopMapLoading(true);
      setGolfShopMapError(null);
      setNearbyGolfShops([]);

        if (!("geolocation" in navigator)) {
          if (!cancelled) {
          setGolfShopMapError(t("home.nearbyShopsLocationUnavailable"));
          setGolfShopMapLoading(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          if (cancelled) return;

          const center: [number, number] = [
            coords.latitude,
            coords.longitude,
          ];
          setGolfShopMapCenter(center);

          try {
            const shops = await fetchNearbyGolfShopsWithRetry(
              coords.latitude,
              coords.longitude,
            );

            if (cancelled) return;

            setNearbyGolfShops(shops);
            if (shops.length === 0) {
              setGolfShopMapError("No nearby golf shops were found.");
            }
          } catch {
            if (!cancelled) {
              setGolfShopMapError(
                t("home.nearbyShopsUnavailable"),
              );
            }
          } finally {
            if (!cancelled) {
              setGolfShopMapLoading(false);
            }
          }
        },
        () => {
          if (!cancelled) {
            setGolfShopMapError(t("home.nearbyShopsAllowLocation"));
            setGolfShopMapLoading(false);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 300000,
        },
      );
    };

    void loadNearbyGolfShops();

    return () => {
      cancelled = true;
    };
  }, [golfShopModalOpen, t]);

  useEffect(() => {
    fetchFeaturedProducts(8).then((result) => {
      if (result.data) {
        setFeatured(result.data);
      }
    });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchClubProducts({ page: 1, limit: 1 }),
      fetchBallProducts({ page: 1, limit: 1 }),
      fetchBagProducts({ page: 1, limit: 1 }),
      fetchApparelProducts({ page: 1, limit: 1 }),
      fetchAccessoryProducts({ page: 1, limit: 1 }),
      fetchBrandCount(),
    ]).then(([clubs, balls, bags, apparel, accessories, brands]) => {
      const total =
        (clubs.data?.total ?? 0) +
        (balls.data?.total ?? 0) +
        (bags.data?.total ?? 0) +
        (apparel.data?.total ?? 0) +
        (accessories.data?.total ?? 0);
      if (total > 0) setTotalProductCount(total);
      if (brands.data && brands.data > 0) setBrandCount(brands.data);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchClubProducts({ category: "Drivers", page: 1, limit: 1 }),
      fetchClubProducts({ category: "Irons", page: 1, limit: 1 }),
      fetchClubProducts({ category: "Putters", page: 1, limit: 1 }),
      fetchBallProducts({ page: 1, limit: 1 }),
      fetchBagProducts({ page: 1, limit: 1 }),
      fetchApparelProducts({ page: 1, limit: 1 }),
    ]).then(([drivers, irons, putters, balls, bags, apparel]) => {
      if (cancelled) return;

      setHomeCategoryCounts({
        drivers: drivers.data?.total ?? 0,
        irons: irons.data?.total ?? 0,
        putters: putters.data?.total ?? 0,
        balls: balls.data?.total ?? 0,
        bags: bags.data?.total ?? 0,
        apparel: apparel.data?.total ?? 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const formatExactCount = (count: number) => new Intl.NumberFormat().format(count);
  const categoryCountLabel = (count: number | null) =>
    count === null
      ? "..."
      : t("home.productCountLabel", { count: formatExactCount(count) });

  useEffect(() => {
    Promise.all([
      fetchBallProducts({ page: 1, limit: 1, sort: "RATING_DESC" }),
      fetchBagProducts({ page: 1, limit: 1, sort: "RATING_DESC" }),
      fetchAccessoryProducts({ page: 1, limit: 1, sort: "RATING_DESC" }),
    ]).then(([balls, bags, accessories]) => {
      if (balls.data?.items?.[0]) setSpotlightBall(balls.data.items[0]);
      if (bags.data?.items?.[0]) setSpotlightBag(bags.data.items[0]);
      if (accessories.data?.items?.[0]) {
        setSpotlightAccessory(accessories.data.items[0]);
      }
    });
  }, []);

  const homeProducts = useMemo(() => {
    type HomeFeaturedRow = {
      id: string;
      brand: string;
      name: string;
      price: number;
      originalPrice?: number;
      rating: number;
      reviewCount: number;
      badge: string;
      imageUrl?: string;
      filter: "clubs" | "balls" | "bags" | "accessories";
    };

    const clubRows: HomeFeaturedRow[] = featured.slice(0, 3).map((item) => ({
      id: item.id,
      brand: item.brand,
      name: item.name,
      price: item.price ?? 0,
      originalPrice: item.originalPrice,
      rating: item.rating ?? 4.8,
      reviewCount: item.reviewCount ?? 0,
      badge: item.badge ?? "Best Seller",
      imageUrl: item.imageUrl,
      filter: "clubs",
    }));

    const extras: HomeFeaturedRow[] = [];
    if (spotlightBall) {
      extras.push({
        id: spotlightBall.id,
        brand: spotlightBall.brand,
        name: spotlightBall.name,
        price: spotlightBall.price ?? 0,
        originalPrice: spotlightBall.originalPrice,
        rating: spotlightBall.rating ?? 4.8,
        reviewCount: spotlightBall.reviewCount ?? 0,
        badge:
          spotlightBall.badge != null ? String(spotlightBall.badge) : "Popular",
        imageUrl: spotlightBall.imageUrl,
        filter: "balls",
      });
    }
    if (spotlightBag) {
      extras.push({
        id: spotlightBag.id,
        brand: spotlightBag.brand,
        name: spotlightBag.name,
        price: spotlightBag.price ?? 0,
        originalPrice: spotlightBag.originalPrice,
        rating: spotlightBag.rating ?? 4.8,
        reviewCount: spotlightBag.reviewCount ?? 0,
        badge: spotlightBag.badge != null ? String(spotlightBag.badge) : "Sale",
        imageUrl: spotlightBag.imageUrl,
        filter: "bags",
      });
    }
    if (spotlightAccessory) {
      extras.push({
        id: spotlightAccessory.id,
        brand: spotlightAccessory.brand,
        name: spotlightAccessory.name,
        price: spotlightAccessory.price ?? 0,
        originalPrice: spotlightAccessory.originalPrice,
        rating: spotlightAccessory.rating ?? 4.8,
        reviewCount: spotlightAccessory.reviewCount ?? 0,
        badge:
          spotlightAccessory.badge != null
            ? String(spotlightAccessory.badge)
            : "Popular",
        imageUrl: spotlightAccessory.imageUrl,
        filter: "accessories",
      });
    }

    return [...clubRows, ...extras];
  }, [featured, spotlightBall, spotlightBag, spotlightAccessory]);

  const filteredFeatured = useMemo(() => {
    const q = homeSearch.trim().toLowerCase();
    return homeProducts.filter((item) => {
      const matchesSearch =
        !q || `${item.name} ${item.brand}`.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "all" || item.filter === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [homeProducts, homeSearch, activeFilter]);

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={homeSearch}
        onSearchChange={setHomeSearch}
        searchPlaceholder={t("search.placeholderHome")}
      />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[#22c55e]/20 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#d7a422]/20 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-4 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                  </span>
                  <span className="text-sm font-medium text-[var(--gl-accent-text)]">
                    {t("home.badgeNew")}
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl lg:text-6xl">
                  {t("home.heroLine1")}{" "}
                  <span className="text-[#22c55e]">{t("home.heroAccent")}</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  {t("home.heroSub")}
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link
                    to="/sale"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-[#22c55e] px-6 py-2.5 text-base font-medium text-[#05230f] transition-all hover:bg-[#2fd668]"
                  >
                    {t("home.shopCollection")}
                    <span>→</span>
                  </Link>
                  <Link
                    to={accountPath}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] px-6 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 hover:bg-[var(--gl-raised)]"
                  >
                    {isAuthenticated
                      ? t("home.myAccount")
                      : t("home.loginSignup")}
                  </Link>
                </div>
                <div className="mt-12 flex flex-wrap gap-4 pt-8 border-t border-[var(--gl-border)]">
                  {(
                    [
                      [totalProductCount !== null ? formatProductCount(totalProductCount) : "...", "home.statProducts", "🏌️", true],
                      [brandCount !== null ? `${brandCount}+` : "...", "home.statBrands", "🏆", true],
                      ["98%", "home.statGolfers", "⛳", false],
                    ] as [string, string, string, boolean][]
                  ).map(([value, labelKey, icon, isLive], idx) => (
                    <div 
                      key={labelKey}
                      style={{ animationDelay: `${idx * 1.5}s` }}
                      className="group/stat animate-hero-float relative flex flex-col items-start gap-1 rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-5 pr-8 shadow-sm transition-all hover:border-[#22c55e]/30 hover:shadow-md"
                    >
                      {isLive && (
                        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-60">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                          <span className="text-[9px] font-bold uppercase tracking-widest leading-none text-slate-500 dark:text-slate-400">Live</span>
                        </div>
                      )}
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e]/10 text-xl transition-transform group-hover/stat:scale-110">
                        {icon}
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold tracking-tight text-[var(--gl-heading)] group-hover/stat:text-[#22c55e] transition-colors">
                          {value}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {t(labelKey)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
              <div
                onMouseMove={handleHeroMouseMove}
                className="group relative block w-full aspect-square overflow-hidden rounded-3xl bg-[var(--gl-surface-muted)] border border-[var(--gl-border-soft)] text-left transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#22c55e]/10"
              >
                  {/* Schematic / Blueprint Background */}
                  <div className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.12]">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      {/* Stylized Golf Hole Path - Animated Tracer */}
                      <path 
                        d="M 50,350 Q 150,300 100,200 T 350,50" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeDasharray="12,8"
                        className="animate-shot-tracer"
                      />
                      <circle cx="350" cy="50" r="10" fill="currentColor" opacity="0.5" />
                      <circle cx="50" cy="350" r="15" fill="currentColor" opacity="0.3" />
                    </svg>
                  </div>

                  {/* Interactive Glow Overlay */}
                  <div 
                    className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle 120px at ${heroMousePos.x}% ${heroMousePos.y}%, rgba(34, 197, 94, 0.08), transparent)`
                    }}
                  />

                  {/* Gradient Overlay for Depth — stronger tints in light mode only */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#22c55e]/26 via-[#ca8a04]/14 via-35% to-white/40 dark:from-[#22c55e]/6 dark:via-transparent dark:to-transparent" />

                  <div className="absolute inset-0 p-10 z-10 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setGolfShopModalOpen(true)}
                      aria-label="Open nearby golf shops map"
                      className="rounded-full bg-white/90 p-2 shadow-[0_8px_30px_rgb(0_0_0_/0.12)] ring-1 ring-[#15803d]/20 backdrop-blur-[2px] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgb(34_197_94_/0.18)] hover:ring-[#15803d]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50 dark:bg-transparent dark:p-0 dark:shadow-none dark:ring-0 dark:backdrop-blur-none dark:hover:shadow-none dark:hover:ring-0"
                    >
                      <svg
                        viewBox="0 0 200 200"
                        className="h-32 w-32 drop-shadow-[0_2px_8px_rgba(21,128,61,0.25)] transition-transform duration-500 ease-out group-hover:scale-110 dark:drop-shadow-none"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Clean Pulsing Rings — higher base visibility on light surfaces */}
                        <circle cx="100" cy="100" r="40" fill="#15803e" className="dark:fill-[#22c55e]" opacity="0.28">
                          <animate attributeName="r" values="40;55;40" dur="3s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.28;0.06;0.28" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="100" cy="100" r="40" fill="#15803e" className="dark:fill-[#22c55e]" opacity="0.2">
                          <animate attributeName="r" values="40;70;40" dur="4s" begin="1.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.2;0.04;0.2" dur="4s" begin="1.5s" repeatCount="indefinite" />
                        </circle>

                        {/* Main Map Circle — slightly deeper green in light mode for contrast */}
                        <circle
                          cx="100"
                          cy="100"
                          r="36"
                          fill="#15803e"
                          className="shadow-inner dark:fill-[#22c55e]"
                        />
                        <path
                          d="M100 76C89.8 76 81.5 84.2 81.5 94.3C81.5 108.4 100 126 100 126C100 126 118.5 108.4 118.5 94.3C118.5 84.2 110.2 76 100 76Z"
                          fill="white"
                        />
                        <circle
                          cx="100"
                          cy="94"
                          r="7"
                          fill="#15803e"
                          className="dark:fill-[#22c55e]"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Redesigned Info Cards - Matching Site Style */}
                  <div className="absolute left-6 top-6 rounded-xl bg-[var(--gl-surface)] border border-[var(--gl-border-soft)] p-3 shadow-md z-20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22c55e]/15 text-sm">
                        🏌️
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--gl-heading)]">
                          {t("home.heroOverlayProTitle")}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t("home.heroOverlayProSub")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 rounded-xl bg-[var(--gl-surface)] border border-[var(--gl-border-soft)] p-3 shadow-md z-20">
                    <p className="text-xs font-semibold text-[var(--gl-heading)] text-center">
                      {t("home.heroOverlayRating")}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                      {t("home.heroOverlayReviews")}
                    </p>
                  </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--gl-border)] bg-[var(--gl-surface-60)] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t("home.legendsTagline")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {legendsCards.map(([name, note, imageUrl]) => (
                <div
                  key={name}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gl-border)] sm:h-28 sm:w-28">
                    <img
                      src={imageUrl}
                      alt={name}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "/products/club.jpg";
                      }}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {name}
                    </span>
                    <span className="text-[10px] font-medium text-[#22c55e]">
                      {note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--gl-surface-30)] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-4xl">
                  {t("home.shopByCategory")}
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {t("home.shopByCategorySub")}
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "home.shopByCategoryCardDriversTitle",
                  "home.shopByCategoryCardDriversDesc",
                  categoryCountLabel(homeCategoryCounts.drivers),
                  "🏌️",
                  "home.shopByCategoryCardPopularBadge",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardIronsTitle",
                  "home.shopByCategoryCardIronsDesc",
                  categoryCountLabel(homeCategoryCounts.irons),
                  "⛳",
                  "",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardPuttersTitle",
                  "home.shopByCategoryCardPuttersDesc",
                  categoryCountLabel(homeCategoryCounts.putters),
                  "🎯",
                  "",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardBallsTitle",
                  "home.shopByCategoryCardBallsDesc",
                  categoryCountLabel(homeCategoryCounts.balls),
                  "⚪",
                  "home.shopByCategoryCardPopularBadge",
                  "/balls",
                ],
                [
                  "home.shopByCategoryCardBagsTitle",
                  "home.shopByCategoryCardBagsDesc",
                  categoryCountLabel(homeCategoryCounts.bags),
                  "🎒",
                  "",
                  "/bags",
                ],
                [
                  "home.shopByCategoryCardApparelTitle",
                  "home.shopByCategoryCardApparelDesc",
                  categoryCountLabel(homeCategoryCounts.apparel),
                  "👕",
                  "",
                  "/apparel",
                ],
              ].map(([titleKey, descKey, countLabel, emoji, badgeKey, to]) => (
                <Link
                  key={titleKey}
                  to={to}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-6 transition-all hover:border-[#22c55e]/50"
                >
                  {badgeKey ? (
                    <div className="absolute right-4 top-4 rounded-full bg-[#22c55e]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--gl-accent-text)]">
                      {t(badgeKey)}
                    </div>
                  ) : null}
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--gl-card)] text-2xl">
                    {emoji}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t(descKey)}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {countLabel}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gl-card)] text-slate-900 dark:text-slate-100 transition-all group-hover:bg-[#22c55e] group-hover:text-[#062412]">
                      ↗
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-4xl">
                  {t("home.featuredProducts")}
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {t("home.featuredSub")}
                </p>
              </div>
              <Link
                to="/sale"
                className="text-sm font-medium text-[#22c55e] hover:text-[var(--gl-accent-text)]"
              >
                {t("home.viewAllProducts")}
              </Link>
            </div>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
              {(
                [
                  ["all", "home.filterAllProducts"],
                  ["clubs", "nav.clubs"],
                  ["balls", "nav.balls"],
                  ["bags", "nav.bags"],
                  ["accessories", "nav.accessories"],
                ] as const
              ).map(([value, labelKey]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      value as
                        | "all"
                        | "clubs"
                        | "balls"
                        | "bags"
                        | "accessories",
                    )
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeFilter === value
                      ? "bg-[#22c55e] text-[#062412]"
                      : "bg-[var(--gl-surface)] text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredFeatured.slice(0, 8).map((item) =>
                (() => {
                  const safeRating =
                    typeof item.rating === "number" ? item.rating : 0;
                  const safeReviewCount =
                    typeof item.reviewCount === "number" ? item.reviewCount : 0;
                  const safePrice =
                    typeof item.price === "number" ? item.price : 0;
                  const hasOriginalPrice =
                    typeof item.originalPrice === "number";
                  return (
                    <article
                      key={item.id}
                      data-product-id={item.id}
                      className="group relative overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] transition-all hover:border-[#22c55e]/40"
                    >
                      <div className="relative aspect-square overflow-hidden bg-[var(--gl-card)]">
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
                                `${item.filter} golf product`,
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
                        <div className="absolute left-3 top-3 z-10">
                          <span className="rounded-md bg-[#22c55e]/20 px-2 py-0.5 text-xs font-medium text-[var(--gl-accent-text)]">
                            {item.badge}
                          </span>
                        </div>
                        <WishlistToggleButton
                          itemId={item.id}
                          itemName={item.name}
                          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gl-deep)]/90 transition-all"
                        />
                        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(event) =>
                              addItemToCart(
                                {
                                  id: item.id,
                                  brand: item.brand,
                                  name: item.name,
                                  imageUrl: item.imageUrl ?? undefined,
                                  price: safePrice,
                                  originalPrice: hasOriginalPrice
                                    ? item.originalPrice
                                    : undefined,
                                },
                                centerOfElement(event.currentTarget),
                              )
                            }
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#062412]"
                          >
                            {t("home.quickAdd")}
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
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
                          {safeRating.toFixed(1)} ({safeReviewCount})
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
                })(),
              )}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() => setTrustModal("ship")}
                className="flex items-center gap-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22c55e]/60 hover:bg-[var(--gl-surface)]/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[#22c55e]"
                    aria-hidden="true"
                  >
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {t("home.trustShipTitle")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("home.trustShipSub")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrustModal("pay")}
                className="flex items-center gap-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22c55e]/60 hover:bg-[var(--gl-surface)]/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[#22c55e]"
                    aria-hidden="true"
                  >
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {t("home.trustPayTitle")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("home.trustPaySub")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrustModal("returns")}
                className="flex items-center gap-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22c55e]/60 hover:bg-[var(--gl-surface)]/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[#22c55e]"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {t("home.trustReturnsTitle")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("home.trustReturnsSub")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTrustModal("support")}
                className="flex items-center gap-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22c55e]/60 hover:bg-[var(--gl-surface)]/90 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-[#22c55e]"
                    aria-hidden="true"
                  >
                    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {t("home.trustSupportTitle")}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("home.trustSupportSub")}
                  </p>
                </div>
              </button>
            </div>

            {trustModal ? (
              <div
                className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
                role="dialog"
                aria-modal="true"
                onClick={() => setTrustModal(null)}
              >
                <div
                  className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="relative overflow-hidden border-b border-[var(--gl-border-muted)] bg-gradient-to-br from-[#22c55e]/10 via-[var(--gl-surface-muted)]/80 to-[#d7a422]/10 px-6 py-5 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)]/80 px-3 py-2 shadow-sm">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22c55e]/15 text-lg">
                          {trustModalIcon[trustModal]}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {t(trustModalCopy[trustModal].titleKey)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {t(trustModalCopy[trustModal].subKey)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)]/70 p-4 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.45)]">
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {t(trustModalCopy[trustModal].bodyKey)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTrustModal(null)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gl-border)] text-slate-700 transition-colors hover:bg-[var(--gl-hover)] dark:text-slate-200"
                      aria-label={t("product.modalClose")}
                    >
                      ✕
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            ) : null}

            {legendsVideoModalOpen ? (
              <div
                className="fixed inset-0 z-[85] flex items-end justify-center bg-black/60 p-4 sm:items-center"
                role="dialog"
                aria-modal="true"
                onClick={() => setLegendsVideoModalOpen(false)}
              >
                <div
                  className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 bg-[var(--gl-surface-muted)]/60 px-6 py-5">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t("home.legendsVideoTitle")}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {t("home.legendsVideoSubtitle")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLegendsVideoModalOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gl-border)] text-slate-700 transition-colors hover:bg-[var(--gl-hover)] dark:text-slate-200"
                      aria-label={t("product.modalClose")}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="aspect-video overflow-hidden rounded-xl border border-[var(--gl-border-strong)] bg-black">
                      <iframe
                        title={t("home.legendsVideoTitle")}
                        src="https://www.youtube-nocookie.com/embed/B_tkJEAGMDE?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1"
                        className="h-full w-full"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                      />
                    </div>

                    <div className="mt-6">
                      <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        {t("home.legendsTagline")}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                        {legendsCards.map(([name, note, imageUrl]) => (
                          <div
                            key={name}
                            className="group flex flex-col items-center gap-2"
                          >
                            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--gl-border)] sm:h-28 sm:w-28">
                              <img
                                src={imageUrl}
                                alt={name}
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.src = "/products/club.jpg";
                                }}
                                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                            </div>
                            <div className="text-center">
                              <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">
                                {name}
                              </span>
                              <span className="text-[10px] font-medium text-[#22c55e]">
                                {note}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {golfShopModalOpen ? (
              <div
                className="fixed inset-0 z-[86] flex items-end justify-center bg-black/60 p-4 sm:items-center"
                role="dialog"
                aria-modal="true"
                onClick={() => setGolfShopModalOpen(false)}
              >
                <div
                  className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 bg-[var(--gl-surface-muted)]/70 px-6 py-5">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {t("home.nearbyShopsTitle")}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {t("home.nearbyShopsSubtitle")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGolfShopModalOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--gl-border)] text-slate-700 transition-colors hover:bg-[var(--gl-hover)] dark:text-slate-200"
                      aria-label={t("product.modalClose")}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                    <div className="overflow-hidden rounded-2xl border border-[var(--gl-border-strong)] bg-[var(--gl-surface-muted)]">
                      <div className="h-[320px] w-full">
                        {golfShopMapCenter ? (
                          <iframe
                            title="Nearby golf shops map"
                            src={buildOpenStreetMapEmbedUrl(
                              golfShopMapCenter[0],
                              golfShopMapCenter[1],
                            )}
                            className="h-full w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-600 dark:text-slate-400">
                            {golfShopMapLoading
                              ? t("home.nearbyShopsLoadingMap")
                              : t("home.nearbyShopsAllowLocationMap")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {golfShopMapLoading ? (
                        <div className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-4 text-sm text-slate-600 dark:text-slate-400">
                          {t("home.nearbyShopsLoadingList")}
                        </div>
                      ) : null}

                      {golfShopMapError ? (
                        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
                          <p>{golfShopMapError}</p>
                          {golfShopMapCenter ? (
                            <a
                              href={buildGoogleMapsNearbySearchUrl(
                                golfShopMapCenter[0],
                                golfShopMapCenter[1],
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center rounded-md bg-amber-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
                            >
                              {t("home.nearbyShopsOpenMaps")}
                            </a>
                          ) : null}
                        </div>
                      ) : null}

                      {nearbyGolfShopPreview.map((shop) => (
                        <a
                          key={shop.id}
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.address}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-4 transition-colors hover:border-[#22c55e]/50 hover:bg-[var(--gl-surface)]"
                        >
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {shop.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            {shop.address}
                          </p>
                          <p className="mt-2 text-xs font-medium text-[#22c55e]">
                            {shop.distanceKm.toFixed(1)} km away
                          </p>
                        </a>
                      ))}

                      {golfShopMapCenter &&
                      !golfShopMapLoading &&
                      !golfShopMapError &&
                      nearbyGolfShops.length > 3 ? (
                        <a
                          href={buildGoogleMapsNearbySearchUrl(
                            golfShopMapCenter[0],
                            golfShopMapCenter[1],
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--gl-heading)] transition-colors hover:border-[#22c55e]/50 hover:bg-[var(--gl-surface)]"
                        >
                          {t("home.nearbyShopsViewAll")}
                        </a>
                      ) : null}

                      {!golfShopMapLoading &&
                      !golfShopMapError &&
                      nearbyGolfShops.length === 0 ? (
                        <div className="rounded-2xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-4 text-sm text-slate-600 dark:text-slate-400">
                          {t("home.nearbyShopsEmpty")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative overflow-hidden rounded-3xl bg-[#22c55e] p-8 sm:p-12 lg:p-16">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#d7a422] blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#f3fff7] blur-3xl" />
              </div>
              <div className="relative grid items-center gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-[#062412] sm:text-4xl lg:text-5xl">
                    {t("home.promoSpringTitle")}
                  </h2>
                  <p className="mt-4 text-lg text-[#0b3d22]/80">
                    {t("home.promoSpringSub")}
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <Link
                      to="/sale"
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#f3fff7] px-6 py-2.5 text-sm font-medium text-[#062412] hover:bg-[#f3fff7]/90"
                    >
                      {t("home.promoShopSale")}
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
                    </Link>
                    <Link
                      to="/auth"
                      className="inline-flex items-center justify-center rounded-md border border-[#062412]/30 px-6 py-2.5 text-sm font-medium text-[#062412] hover:bg-[#f3fff7]/20"
                    >
                      {t("home.promoJoinFree")}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <span className="block font-[family-name:var(--font-heading)] text-7xl font-bold text-[#062412] sm:text-8xl lg:text-9xl">
                      {t("home.promoPercent")}
                    </span>
                    <span className="mt-2 block text-xl font-medium uppercase tracking-wider text-[#0b3d22]/80">
                      {t("home.promoOffSelected")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] bg-[var(--gl-page)] px-4 py-16 text-center text-sm text-slate-600 dark:text-slate-400">
          Loading page...
        </div>
      }
    >
      <>
        <CartFlyOverlay />
        <RouteActionBridge />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportShell slug="home" />} />
          <Route path="/support/contact" element={<SupportShell slug="contact" />} />
          <Route path="/support/faqs" element={<SupportShell slug="faqs" />} />
          <Route path="/support/shipping" element={<SupportShell slug="shipping" />} />
          <Route path="/support/returns" element={<SupportShell slug="returns" />} />
          <Route path="/support/size-guide" element={<SupportShell slug="size-guide" />} />
          <Route path="/support/track-order" element={<SupportShell slug="track-order" />} />
          <Route path="/support/privacy" element={<SupportShell slug="privacy" />} />
          <Route path="/support/terms" element={<SupportShell slug="terms" />} />
          <Route path="/support/cookies" element={<SupportShell slug="cookies" />} />
          <Route path="/careers" element={<CompanyShell slug="careers" />} />
          <Route path="/press" element={<CompanyShell slug="press" />} />
          <Route path="/blog" element={<CompanyShell slug="blog" />} />
          <Route path="/partners" element={<CompanyShell slug="partners" />} />
          <Route path="/affiliates" element={<CompanyShell slug="affiliates" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/sale" element={<SalePage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/balls" element={<BallsPage />} />
          <Route path="/bags" element={<BagsPage />} />
          <Route path="/apparel" element={<ApparelPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Suspense fallback={null}>
        <AiAssistantWidget />
        <ChatWidget />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

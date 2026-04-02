import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { normalizeLang } from "./i18n";
import { useTheme } from "./theme-context";
import { SiteNavDesktop, SiteNavMobileDrawer } from "./components/SiteNav";
import AboutPageView from "./pages/AboutPageView";
import CompanyMarketingPageView from "./pages/CompanyMarketingPageView";
import SupportPageView from "./pages/SupportPageView";
import type { CompanyPageSlug } from "./pages/company/company-page-slugs";
import type { SupportPageSlug } from "./pages/support/support-page-slugs";

type Mode = "login" | "signup";
type UserRole = "CUSTOMER" | "ADMIN";

type User = {
  id: string;
  email: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
};

type MyPageData = {
  user: User;
  displayName: string;
  memberTier: string;
  stats: {
    totalOrders: number;
    wishlistItems: number;
    rewardPoints: number;
  };
  recentOrders: Array<{
    orderNumber: string;
    orderDate: string;
    itemCount: number;
    status: string;
    totalAmount: number;
  }>;
  wishlist: Array<{
    brand: string;
    productName: string;
    price: number;
  }>;
  savedAddresses: Array<{
    label: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
};

type SaleItem = {
  id: string;
  category: string;
  saleGroup: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  salePrice: number;
  originalPrice: number;
  badge?: string;
  imageUrl?: string;
};

type CartItem = {
  id: string;
  brand: string;
  name: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
};

type PlaceOrderInput = {
  contactEmail: string;
  contactPhone: string;
  deliveryName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  shippingMethod: "STANDARD" | "EXPRESS";
  paymentMethod: "CARD" | "PAYPAL" | "BANK_TRANSFER";
  cardHolderName: string;
  cardNumberMasked: string;
  cardExpiry: string;
  items: Array<{
    id: string;
    brand: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type CheckoutOrderResult = {
  orderNumber: string;
  placedAtIso: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  shippingMethod: string;
  contactEmail: string;
  deliveryName: string;
  deliveryAddressLine1: string;
  deliveryAddressLine2?: string;
  deliveryCity: string;
  deliveryRegion: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  items: Array<{
    id: string;
    brand: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

type ClubItem = {
  id: string;
  category:
    | "Drivers"
    | "Irons"
    | "Putters"
    | "Fairway Woods"
    | "Hybrids"
    | "Wedges";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "New" | "Popular" | "Sale";
  imageUrl?: string;
};

type BallItem = {
  id: string;
  category: "Tour Performance" | "Distance" | "Low Compression" | "Value";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Best Value";
  imageUrl?: string;
};

type BagItem = {
  id: string;
  category:
    | "Stand Bags"
    | "Cart Bags"
    | "Travel Bags"
    | "Staff Bags"
    | "Carry Bags";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium";
  imageUrl?: string;
};

type ApparelItem = {
  id: string;
  category: "Shoes" | "Polos" | "Pants" | "Shorts" | "Headwear" | "Gloves";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium" | "Best Value";
  imageUrl?: string;
};

type AccessoryItem = {
  id: string;
  category:
    | "Rangefinders"
    | "GPS Watches"
    | "Grips"
    | "Training Aids"
    | "Tees"
    | "Divot Tools";
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: "Best Seller" | "Popular" | "New" | "Sale" | "Premium";
  imageUrl?: string;
};

type ProductDetailData = {
  id: string;
  source: string;
  category: string;
  brand: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  imageUrl?: string;
  description: string;
};

type ChatIdentity = {
  userId: string;
  userName: string;
};

type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

type AiPanelMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

/**
 * Default to same-origin API paths so the browser can use Vite's dev proxy.
 * Set `VITE_API_URL` in `frontend/.env` to override this when needed.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

const GRAPHQL_ENDPOINT = `${API_BASE}/graphql`;
const CHAT_WS_ENDPOINT = `${API_BASE}/chat`;
const AI_CHAT_ENDPOINT = `${API_BASE}/ai-chat/respond`;
const AI_PROJECT_INFO_ENDPOINT = `${API_BASE}/ai-chat/project-info`;
const TOKEN_KEY = "golf_auth_token";
const WISHLIST_KEY = "golf_wishlist_ids";
const NEWSLETTER_KEY = "golf_newsletter_subscribers";
const CART_KEY = "golf_cart_items";
const CART_CHANGED_EVENT = "cart:changed";
const CART_FLY_EVENT = "cart:fly";

type CartFlyOrigin = { clientX: number; clientY: number };

function centerOfElement(el: HTMLElement): CartFlyOrigin {
  const r = el.getBoundingClientRect();
  return {
    clientX: r.left + r.width / 2,
    clientY: r.top + r.height / 2,
  };
}
const CHAT_UNREAD_KEY = "golf_chat_unread";
const CHAT_HIDDEN_PREFIX = "golf_chat_hidden_";
const AI_HISTORY_PREFIX = "golf_ai_history_";

const GREENLINKS_AI_OPEN_EVENT = "greenlinks-open-ai-assistant";

const PRICE_FILTER_OPTIONS = [
  "Under $50",
  "$50 - $100",
  "$100 - $250",
  "$250 - $500",
  "Over $500",
] as const;

const COUNTRY_OPTIONS = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
] as const;

const CITY_OPTIONS_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "San Diego",
    "San Jose",
    "Austin",
    "Dallas",
    "Seattle",
  ],
  Canada: [
    "Toronto",
    "Montreal",
    "Vancouver",
    "Calgary",
    "Edmonton",
    "Ottawa",
    "Winnipeg",
    "Quebec City",
  ],
  "United Kingdom": [
    "London",
    "Manchester",
    "Birmingham",
    "Liverpool",
    "Leeds",
    "Glasgow",
    "Edinburgh",
    "Bristol",
  ],
  Australia: [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Canberra",
    "Gold Coast",
    "Hobart",
  ],
  Germany: [
    "Berlin",
    "Hamburg",
    "Munich",
    "Cologne",
    "Frankfurt",
    "Stuttgart",
    "Dusseldorf",
    "Dortmund",
  ],
  France: [
    "Paris",
    "Marseille",
    "Lyon",
    "Toulouse",
    "Nice",
    "Nantes",
    "Strasbourg",
    "Montpellier",
  ],
  Spain: [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Seville",
    "Zaragoza",
    "Malaga",
    "Murcia",
    "Palma",
  ],
  Italy: [
    "Rome",
    "Milan",
    "Naples",
    "Turin",
    "Palermo",
    "Genoa",
    "Bologna",
    "Florence",
  ],
  Japan: [
    "Tokyo",
    "Osaka",
    "Yokohama",
    "Nagoya",
    "Sapporo",
    "Fukuoka",
    "Kobe",
    "Kyoto",
  ],
  "South Korea": [
    "Seoul",
    "Busan",
    "Incheon",
    "Daegu",
    "Daejeon",
    "Gwangju",
    "Suwon",
    "Ulsan",
  ],
  Uzbekistan: [
    "Tashkent",
    "Samarkand",
    "Bukhara",
    "Namangan",
    "Andijan",
    "Nukus",
    "Fergana",
    "Khiva",
  ],
};

function translatePriceFilterLabel(option: string, t: TFunction): string {
  switch (option) {
    case "Under $50":
      return t("catalog.under50");
    case "$50 - $100":
      return t("catalog.50to100");
    case "$100 - $250":
      return t("catalog.100to250");
    case "$250 - $500":
      return t("catalog.250to500");
    case "Over $500":
      return t("catalog.over500");
    default:
      return option;
  }
}

type GreenlinksAiOpenDetail = {
  message?: string;
  autoSend?: boolean;
};

function openGreenlinksAiAssistant(detail: GreenlinksAiOpenDetail = {}) {
  window.dispatchEvent(new CustomEvent(GREENLINKS_AI_OPEN_EVENT, { detail }));
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage errors (private mode / restricted browser settings).
  }
}

function readUnreadChatCount(): number {
  try {
    const raw = localStorage.getItem(CHAT_UNREAD_KEY);
    const parsed = Number(raw ?? 0);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

function persistUnreadChatCount(value: number): void {
  try {
    localStorage.setItem(CHAT_UNREAD_KEY, String(Math.max(0, value)));
  } catch {
    // Ignore storage errors.
  }
}

function readHiddenChatMessageIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${CHAT_HIDDEN_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function persistHiddenChatMessageIds(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(`${CHAT_HIDDEN_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // Ignore storage errors.
  }
}

function readAiHistory(userId: string): AiPanelMessage[] {
  try {
    const raw = localStorage.getItem(`${AI_HISTORY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const typed = item as Partial<AiPanelMessage>;
        return {
          id: String(typed.id ?? ""),
          role: typed.role === "user" ? "user" : "assistant",
          text: String(typed.text ?? ""),
          createdAt: String(typed.createdAt ?? new Date().toISOString()),
        } as AiPanelMessage;
      })
      .filter((item) => item.id && item.text.trim().length > 0)
      .slice(-40);
  } catch {
    return [];
  }
}

function persistAiHistory(userId: string, items: AiPanelMessage[]): void {
  try {
    localStorage.setItem(
      `${AI_HISTORY_PREFIX}${userId}`,
      JSON.stringify(items.slice(-40)),
    );
  } catch {
    // Ignore storage errors.
  }
}

function getChatIdentityFromToken(token: string | null): ChatIdentity {
  if (!token) {
    return {
      userId: `guest-${Math.random().toString(36).slice(2, 10)}`,
      userName: "Guest",
    };
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      throw new Error("Invalid token");
    }
    const payloadRaw = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadRaw) as { sub?: string; email?: string };
    const userNameFromEmail =
      payload.email
        ?.split("@")[0]
        ?.replace(/[._-]+/g, " ")
        .trim() || "Member";
    return {
      userId: payload.sub ?? `guest-${Math.random().toString(36).slice(2, 10)}`,
      userName: userNameFromEmail
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" "),
    };
  } catch {
    return {
      userId: `guest-${Math.random().toString(36).slice(2, 10)}`,
      userName: "Guest",
    };
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors (private mode / restricted browser settings).
  }
}

function readWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function persistWishlistIds(ids: string[]): void {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors.
  }
}

function readCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const typed = item as Partial<CartItem>;
        return {
          id: String(typed.id ?? ""),
          brand: String(typed.brand ?? ""),
          name: String(typed.name ?? ""),
          imageUrl:
            typeof typed.imageUrl === "string" ? typed.imageUrl : undefined,
          price: Number(typed.price ?? 0),
          originalPrice:
            typeof typed.originalPrice === "number"
              ? typed.originalPrice
              : undefined,
          quantity: Math.max(1, Number(typed.quantity ?? 1)),
        };
      })
      .filter((item) => item.id && item.name && item.brand && item.price > 0);
    const valid = items.filter((item) => isCatalogUuid(item.id));
    if (valid.length !== items.length) {
      persistCartItems(valid);
      queueMicrotask(() => notifyCartChanged());
    }
    return valid;
  } catch {
    return [];
  }
}

function persistCartItems(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
}

function notifyCartChanged(): void {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

function makeCartItemId(brand: string, name: string): string {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `cart-${normalize(brand)}-${normalize(name)}`;
}

/** Backend `productById` expects a Postgres UUID string. */
const CATALOG_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isCatalogUuid(id: string): boolean {
  return CATALOG_UUID_RE.test(id.trim());
}

function addItemToCart(
  item: Omit<CartItem, "quantity">,
  flyFrom?: CartFlyOrigin | null,
): void {
  const items = readCartItems();
  const existing = items.find((entry) => entry.id === item.id);
  // Toggle behavior: second click removes item instead of increasing quantity.
  const isAdd = !existing;
  const next = existing
    ? items.filter((entry) => entry.id !== item.id)
    : [...items, { ...item, quantity: 1 }];
  persistCartItems(next);
  notifyCartChanged();
  if (isAdd && flyFrom) {
    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent<CartFlyOrigin>(CART_FLY_EVENT, { detail: flyFrom }),
      );
    });
  }
}

function parsePriceValue(text: string): number | null {
  const numeric = text.replace(/[^0-9.]/g, "");
  if (!numeric) return null;
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : null;
}

function extractProductIdFromContainer(container: Element): string | null {
  const attrId = container
    .querySelector("[data-product-id]")
    ?.getAttribute("data-product-id")
    ?.trim();
  if (attrId) return attrId;

  const anchors = container.querySelectorAll('a[href*="/product/"]');
  for (const el of anchors) {
    const href = el.getAttribute("href") ?? "";
    const match = href.match(/\/product\/([^/?#]+)/);
    if (match?.[1]) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }
  return null;
}

function extractCartItemFromButton(
  button: HTMLElement,
): Omit<CartItem, "quantity"> | null {
  const container = button.closest("article, li, .rounded-xl, .rounded-2xl");
  if (!container) return null;

  const name =
    container
      .querySelector(
        "h3, h4, a.line-clamp-2, a.block.line-clamp-2, p.truncate, p.font-semibold",
      )
      ?.textContent?.trim() ??
    container.querySelector("p.font-semibold")?.textContent?.trim() ??
    "";
  if (!name) return null;

  const brand =
    container.querySelector("p.uppercase")?.textContent?.trim() ??
    container.querySelector("p.text-xs")?.textContent?.trim() ??
    "Golf";

  const moneyMatches = Array.from(container.querySelectorAll("span, p, h3, h4"))
    .map((node) => node.textContent ?? "")
    .flatMap((value) => value.match(/\$[\d,]+(?:\.\d{1,2})?/g) ?? []);

  const price = parsePriceValue(moneyMatches[0] ?? "");
  if (price === null) return null;
  const originalPrice = parsePriceValue(moneyMatches[1] ?? "");

  const img = container.querySelector("img") as HTMLImageElement | null;
  const imageUrl =
    (img?.getAttribute("src") ?? img?.getAttribute("data-src") ?? undefined) ||
    undefined;

  const catalogId = extractProductIdFromContainer(container);

  return {
    id: catalogId ?? makeCartItemId(brand, name),
    brand,
    name,
    imageUrl,
    price,
    originalPrice: originalPrice ?? undefined,
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function saveNewsletterEmail(email: string): "created" | "exists" {
  const normalized = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(NEWSLETTER_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const emails = Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry === "string")
      : [];
    if (emails.includes(normalized)) {
      return "exists";
    }
    localStorage.setItem(
      NEWSLETTER_KEY,
      JSON.stringify([...emails, normalized]),
    );
    return "created";
  } catch {
    return "created";
  }
}

function getProductImageUrl(name: string, category = "golf equipment"): string {
  const text = `${category} ${name}`.toLowerCase();

  if (text.includes("rangefinder")) return "/products/rangefinder.jpg";
  if (text.includes("watch") || text.includes("gps"))
    return "/products/watch.jpg";
  if (text.includes("grip")) return "/products/grip.jpg";
  if (text.includes("tee")) return "/products/tees.jpg";
  if (text.includes("training")) return "/products/training.jpg";
  if (text.includes("divot")) return "/products/divot.jpg";

  // Keep all product visuals golf tools/equipment focused.
  if (
    text.includes("shoe") ||
    text.includes("polo") ||
    text.includes("pant") ||
    text.includes("short") ||
    text.includes("hat") ||
    text.includes("headwear") ||
    text.includes("glove")
  ) {
    return "/products/club.jpg";
  }

  if (text.includes("ball")) return "/products/ball.jpg";
  if (text.includes("bag")) return "/products/bag.jpg";
  if (text.includes("driver")) return "/products/driver.jpg";
  if (text.includes("iron")) return "/products/irons.jpg";
  if (text.includes("putter")) return "/products/putter.jpg";
  if (
    text.includes("fairway") ||
    text.includes("hybrid") ||
    text.includes("wedge") ||
    text.includes("club")
  ) {
    return "/products/club.jpg";
  }

  return "/products/club.jpg";
}

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
                  icon: (
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  ),
                },
                {
                  label: "Facebook",
                  icon: (
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  ),
                },
                {
                  label: "YouTube",
                  icon: (
                    <>
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </>
                  ),
                },
              ].map((social) => (
                <Link
                  key={social.label}
                  to="/"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--gl-surface)] text-slate-900 dark:text-slate-100 transition-colors hover:bg-[#22c55e] hover:text-[#062412]"
                  aria-label={social.label}
                >
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
                </Link>
              ))}
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

async function callGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<{ data?: TData; error?: string }> {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    const rawBody = await res.text();
    if (!rawBody.trim()) {
      return {
        error: `The backend at ${GRAPHQL_ENDPOINT} returned an empty response.`,
      };
    }

    let json: {
      data?: TData;
      errors?: Array<{ message?: string }>;
    };

    try {
      json = JSON.parse(rawBody) as {
        data?: TData;
        errors?: Array<{ message?: string }>;
      };
    } catch {
      const contentType = res.headers.get("content-type") ?? "unknown content type";
      return {
        error: `The backend at ${GRAPHQL_ENDPOINT} returned an invalid response (${contentType}).`,
      };
    }

    if (!res.ok) {
      return {
        error:
          json.errors?.[0]?.message ??
          `Request failed with status ${res.status} ${res.statusText}`,
      };
    }

    if (json.errors && json.errors.length) {
      return { error: json.errors[0].message ?? "Unknown error" };
    }

    return { data: json.data };
  } catch (error) {
    if (error instanceof TypeError) {
      return {
        error: `Could not reach the backend at ${GRAPHQL_ENDPOINT}. Make sure the backend server is running.`,
      };
    }
    return { error: error instanceof Error ? error.message : "Network error" };
  }
}

async function callAuthMutation(
  mode: Mode,
  email: string,
  password: string,
  phone?: string,
): Promise<{ token?: string; error?: string }> {
  const mutationName = mode === "login" ? "login" : "signup";
  const query = `
    mutation ${mutationName}($input: ${mode === "login" ? "LoginInput!" : "SignupInput!"}) {
      ${mutationName}(input: $input) {
        accessToken
      }
    }
  `;

  const result = await callGraphql<{
    login?: { accessToken: string };
    signup?: { accessToken: string };
  }>(query, {
    input: mode === "login" ? { email, password } : { email, password, phone },
  });

  if (result.error) {
    return { error: result.error };
  }

  const payload = result.data?.[mutationName];
  const token = payload?.accessToken;
  if (!token) {
    return { error: "No token returned from server" };
  }

  return { token };
}

async function fetchMyPage(
  token: string,
): Promise<{ data?: MyPageData; error?: string }> {
  const query = `
    query MyPage {
      myPage {
        displayName
        memberTier
        user {
          id
          email
          phone
          firstName
          lastName
          role
        }
        stats {
          totalOrders
          wishlistItems
          rewardPoints
        }
        recentOrders {
          orderNumber
          orderDate
          itemCount
          status
          totalAmount
        }
        wishlist {
          brand
          productName
          price
        }
        savedAddresses {
          label
          line1
          line2
          city
          region
          postalCode
          country
          isDefault
        }
      }
    }
  `;

  const result = await callGraphql<{ myPage: MyPageData }>(
    query,
    undefined,
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.myPage) {
    return { error: "Unable to load account details" };
  }
  return { data: result.data.myPage };
}

async function updateMyProfile(
  token: string,
  input: { firstName: string; lastName: string; phone: string },
): Promise<{ data?: MyPageData; error?: string }> {
  const mutation = `
    mutation UpdateMyProfile($input: UpdateProfileInput!) {
      updateMyProfile(input: $input) {
        displayName
        memberTier
        user {
          id
          email
          phone
          firstName
          lastName
          role
        }
        stats {
          totalOrders
          wishlistItems
          rewardPoints
        }
        recentOrders {
          orderNumber
          orderDate
          itemCount
          status
          totalAmount
        }
        wishlist {
          brand
          productName
          price
        }
        savedAddresses {
          label
          line1
          line2
          city
          region
          postalCode
          country
          isDefault
        }
      }
    }
  `;

  const result = await callGraphql<{ updateMyProfile: MyPageData }>(
    mutation,
    {
      input,
    },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.updateMyProfile) {
    return { error: "Unable to update profile" };
  }
  return { data: result.data.updateMyProfile };
}

type AdminUser = User;
type CatalogProductSource =
  | "CLUBS"
  | "BALLS"
  | "BAGS"
  | "APPAREL"
  | "ACCESSORIES"
  | "SALE";

type AdminCatalogProduct = {
  id: string;
  source: CatalogProductSource;
  category: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  salePrice?: number | null;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

async function fetchAdminUsers(
  token: string,
): Promise<{ data?: AdminUser[]; error?: string }> {
  const query = `
    query AdminUsers {
      adminUsers {
        id
        email
        phone
        firstName
        lastName
        role
      }
    }
  `;

  const result = await callGraphql<{ adminUsers: AdminUser[] }>(
    query,
    undefined,
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminUsers ?? [] };
}

async function adminUpdateUserRole(
  token: string,
  userId: string,
  role: UserRole,
): Promise<{ data?: AdminUser; error?: string }> {
  const mutation = `
    mutation AdminUpdateUserRole($userId: String!, $role: UserRole!) {
      adminUpdateUserRole(userId: $userId, role: $role) {
        id
        email
        phone
        firstName
        lastName
        role
      }
    }
  `;

  const result = await callGraphql<{ adminUpdateUserRole: AdminUser }>(
    mutation,
    { userId, role },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.adminUpdateUserRole) {
    return { error: "Unable to update user role" };
  }
  return { data: result.data.adminUpdateUserRole };
}

async function fetchAdminCatalogProducts(
  token: string,
): Promise<{ data?: AdminCatalogProduct[]; error?: string }> {
  const query = `
    query AdminCatalogProducts {
      adminCatalogProducts {
        id
        source
        category
        brand
        name
        price
        originalPrice
        salePrice
        rating
        reviewCount
        badge
        imageUrl
        description
        isFeatured
        isActive
      }
    }
  `;
  const result = await callGraphql<{
    adminCatalogProducts: AdminCatalogProduct[];
  }>(query, undefined, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminCatalogProducts ?? [] };
}

async function adminCreateCatalogProduct(
  token: string,
  input: Omit<AdminCatalogProduct, "id">,
): Promise<{ data?: AdminCatalogProduct; error?: string }> {
  const mutation = `
    mutation AdminCreateCatalogProduct($input: CreateCatalogProductInput!) {
      adminCreateCatalogProduct(input: $input) {
        id
        source
        category
        brand
        name
        price
        originalPrice
        salePrice
        rating
        reviewCount
        badge
        imageUrl
        description
        isFeatured
        isActive
      }
    }
  `;
  const result = await callGraphql<{
    adminCreateCatalogProduct: AdminCatalogProduct;
  }>(mutation, { input }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminCreateCatalogProduct };
}

async function adminUpdateCatalogProduct(
  token: string,
  id: string,
  input: Partial<Omit<AdminCatalogProduct, "id">>,
): Promise<{ data?: AdminCatalogProduct; error?: string }> {
  const mutation = `
    mutation AdminUpdateCatalogProduct($id: String!, $input: UpdateCatalogProductInput!) {
      adminUpdateCatalogProduct(id: $id, input: $input) {
        id
        source
        category
        brand
        name
        price
        originalPrice
        salePrice
        rating
        reviewCount
        badge
        imageUrl
        description
        isFeatured
        isActive
      }
    }
  `;
  const result = await callGraphql<{
    adminUpdateCatalogProduct: AdminCatalogProduct;
  }>(mutation, { id, input }, token);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminUpdateCatalogProduct };
}

async function adminDeleteCatalogProduct(
  token: string,
  id: string,
): Promise<{ data?: boolean; error?: string }> {
  const mutation = `
    mutation AdminDeleteCatalogProduct($id: String!) {
      adminDeleteCatalogProduct(id: $id)
    }
  `;
  const result = await callGraphql<{ adminDeleteCatalogProduct: boolean }>(
    mutation,
    { id },
    token,
  );
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.adminDeleteCatalogProduct ?? false };
}

async function uploadAdminProductImage(
  token: string,
  file: File,
): Promise<{ imageUrl?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${API_BASE}/admin/uploads/product-image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    const json = (await response.json()) as
      | { imageUrl?: string; filename?: string; message?: string }
      | { message?: string | string[] };

    if (!response.ok) {
      const message = Array.isArray(json.message)
        ? json.message[0]
        : (json.message ?? "Image upload failed");
      return { error: message };
    }
    const imageUrl = "imageUrl" in json ? json.imageUrl : undefined;
    if (!imageUrl) {
      return { error: "Image upload failed" };
    }
    return { imageUrl };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}

async function fetchSaleProducts(
  category: string,
  sort: "DISCOUNT_DESC" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC",
  search?: string,
): Promise<{ data?: SaleItem[]; error?: string }> {
  const query = `
    query SaleProducts($input: SaleProductsInput) {
      saleProducts(input: $input) {
        id
        category
        saleGroup
        brand
        name
        rating
        reviewCount
        salePrice
        originalPrice
        badge
        imageUrl
      }
    }
  `;

  const result = await callGraphql<{ saleProducts: SaleItem[] }>(query, {
    input: {
      category,
      sort,
      search,
    },
  });
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.saleProducts ?? [] };
}

async function fetchBrandCount(): Promise<{ data?: number; error?: string }> {
  const query = `query { brandCount }`;
  const result = await callGraphql<{ brandCount: number }>(query, {});
  if (result.error) return { error: result.error };
  return { data: result.data?.brandCount ?? 0 };
}

async function fetchClubProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: ClubItem[]; total: number }; error?: string }> {
  const query = `
    query ClubProducts($input: ClubProductsInput) {
      clubProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    clubProducts: { items: ClubItem[]; total: number };
  }>(query, { input });
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.clubProducts) {
    return { error: "Failed to load club products" };
  }
  return { data: result.data.clubProducts };
}

async function fetchFeaturedProducts(
  limit = 8,
): Promise<{ data?: ClubItem[]; error?: string }> {
  const query = `
    query FeaturedProducts($limit: Float) {
      featuredProducts(limit: $limit) {
        id
        brand
        name
        price
        originalPrice
        imageUrl
      }
    }
  `;

  const result = await callGraphql<{ featuredProducts: ClubItem[] }>(query, {
    limit,
  });
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data?.featuredProducts ?? [] };
}

async function fetchBallProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: BallItem[]; total: number }; error?: string }> {
  const query = `
    query BallProducts($input: BallProductsInput) {
      ballProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    ballProducts: { items: BallItem[]; total: number };
  }>(query, { input });
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.ballProducts) {
    return { error: "Failed to load ball products" };
  }
  return { data: result.data.ballProducts };
}

async function fetchBagProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{ data?: { items: BagItem[]; total: number }; error?: string }> {
  const query = `
    query BagProducts($input: BagProductsInput) {
      bagProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    bagProducts: { items: BagItem[]; total: number };
  }>(query, { input });
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.bagProducts) {
    return { error: "Failed to load bag products" };
  }
  return { data: result.data.bagProducts };
}

async function fetchApparelProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{
  data?: { items: ApparelItem[]; total: number };
  error?: string;
}> {
  const query = `
    query ApparelProducts($input: ApparelProductsInput) {
      apparelProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    apparelProducts: { items: ApparelItem[]; total: number };
  }>(query, { input });
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.apparelProducts) {
    return { error: "Failed to load apparel products" };
  }
  return { data: result.data.apparelProducts };
}

async function fetchAccessoryProducts(input?: {
  category?: string;
  search?: string;
  brand?: string;
  priceRange?:
    | "ALL"
    | "UNDER_50"
    | "RANGE_50_100"
    | "RANGE_100_250"
    | "RANGE_250_500"
    | "OVER_500";
  sort?: "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC";
  page?: number;
  limit?: number;
}): Promise<{
  data?: { items: AccessoryItem[]; total: number };
  error?: string;
}> {
  const query = `
    query AccessoryProducts($input: AccessoryProductsInput) {
      accessoryProducts(input: $input) {
        total
        items {
          id
          category
          brand
          name
          rating
          reviewCount
          price
          originalPrice
          badge
          imageUrl
        }
      }
    }
  `;

  const result = await callGraphql<{
    accessoryProducts: { items: AccessoryItem[]; total: number };
  }>(query, { input });
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.accessoryProducts) {
    return { error: "Failed to load accessory products" };
  }
  return { data: result.data.accessoryProducts };
}

async function fetchProductById(
  id: string,
): Promise<{ data?: ProductDetailData; error?: string }> {
  const trimmed = id.trim();
  if (!isCatalogUuid(trimmed)) {
    return { error: "LEGACY_OR_INVALID_PRODUCT_ID" };
  }

  const query = `
    query ProductById($id: String!) {
      productById(id: $id) {
        id
        source
        category
        brand
        name
        rating
        reviewCount
        price
        originalPrice
        badge
        imageUrl
        description
      }
    }
  `;

  const result = await callGraphql<{ productById: ProductDetailData | null }>(
    query,
    {
      id: trimmed,
    },
  );
  if (result.error) {
    return { error: result.error };
  }
  if (!result.data?.productById) {
    return { error: "Product not found" };
  }
  return { data: result.data.productById };
}

async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ data?: CheckoutOrderResult; error?: string }> {
  const mutation = `
    mutation PlaceOrder($input: PlaceOrderInput!) {
      placeOrder(input: $input) {
        orderNumber
        placedAtIso
        subtotal
        shippingCost
        tax
        total
        currency
        paymentMethod
        shippingMethod
        contactEmail
        deliveryName
        deliveryAddressLine1
        deliveryAddressLine2
        deliveryCity
        deliveryRegion
        deliveryPostalCode
        deliveryCountry
        items {
          id
          brand
          name
          quantity
          unitPrice
          lineTotal
        }
      }
    }
  `;
  const result = await callGraphql<{ placeOrder: CheckoutOrderResult }>(
    mutation,
    { input },
  );
  if (result.error) return { error: result.error };
  if (!result.data?.placeOrder) return { error: "Failed to place order" };
  return { data: result.data.placeOrder };
}

function formatProductCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    return `${formatted}+`;
  }
  return `${n}+`;
}

type NearbyGolfShop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address: string;
  distanceKm: number;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatShopAddress(tags?: Record<string, string>) {
  if (!tags) return "Address unavailable";

  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "Address unavailable";
}

function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number) {
  const latOffset = 0.08;
  const lonOffset = 0.08;
  const bbox = [
    longitude - lonOffset,
    latitude - latOffset,
    longitude + lonOffset,
    latitude + latOffset,
  ]
    .map((value) => value.toFixed(6))
    .join("%2C");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude.toFixed(6)}%2C${longitude.toFixed(6)}`;
}

function buildGoogleMapsNearbySearchUrl(latitude: number, longitude: number) {
  const query = encodeURIComponent("golf shops");
  return `https://www.google.com/maps/search/?api=1&query=${query}&center=${latitude},${longitude}`;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchNearbyGolfShops(latitude: number, longitude: number) {
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["shop"="golf"](around:50000,${latitude},${longitude});
      way["shop"="golf"](around:50000,${latitude},${longitude});
      relation["shop"="golf"](around:50000,${latitude},${longitude});
      node["shop"="sports"]["sport"="golf"](around:50000,${latitude},${longitude});
      way["shop"="sports"]["sport"="golf"](around:50000,${latitude},${longitude});
      relation["shop"="sports"]["sport"="golf"](around:50000,${latitude},${longitude});
    );
    out center tags;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: overpassQuery.trim(),
  });

  if (!response.ok) {
    throw new Error("Failed to load nearby golf shops");
  }

  const data = (await response.json()) as { elements?: OverpassElement[] };
  const seen = new Set<string>();

  return (data.elements ?? [])
    .map((element) => {
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;

      if (typeof lat !== "number" || typeof lon !== "number") {
        return null;
      }

      const name = element.tags?.name?.trim() || "Golf shop";
      const dedupeKey = `${name}-${lat.toFixed(4)}-${lon.toFixed(4)}`;

      if (seen.has(dedupeKey)) {
        return null;
      }

      seen.add(dedupeKey);

      return {
        id: `${element.type}-${element.id}`,
        name,
        lat,
        lon,
        address: formatShopAddress(element.tags),
        distanceKm: calculateDistanceKm(latitude, longitude, lat, lon),
      } satisfies NearbyGolfShop;
    })
    .filter((shop): shop is NearbyGolfShop => Boolean(shop))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 6);
}

async function fetchNearbyGolfShopsWithRetry(
  latitude: number,
  longitude: number,
  maxAttempts = 2,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchNearbyGolfShops(latitude, longitude);
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await wait(800);
      }
    }
  }

  throw lastError;
}

function HomePage() {
  const { t } = useTranslation();
  const isAuthenticated = Boolean(readStoredToken());
  const accountPath = isAuthenticated ? "/my-page" : "/auth";
  const [featured, setFeatured] = useState<ClubItem[]>([]);
  const [spotlightBall, setSpotlightBall] = useState<BallItem | null>(null);
  const [spotlightBag, setSpotlightBag] = useState<BagItem | null>(null);
  const [spotlightAccessory, setSpotlightAccessory] =
    useState<AccessoryItem | null>(null);
  const [totalProductCount, setTotalProductCount] = useState<number | null>(null);
  const [brandCount, setBrandCount] = useState<number | null>(null);
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
                  "home.shopByCategoryCardDriversCount",
                  "🏌️",
                  "home.shopByCategoryCardPopularBadge",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardIronsTitle",
                  "home.shopByCategoryCardIronsDesc",
                  "home.shopByCategoryCardIronsCount",
                  "⛳",
                  "",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardPuttersTitle",
                  "home.shopByCategoryCardPuttersDesc",
                  "home.shopByCategoryCardPuttersCount",
                  "🎯",
                  "",
                  "/clubs",
                ],
                [
                  "home.shopByCategoryCardBallsTitle",
                  "home.shopByCategoryCardBallsDesc",
                  "home.shopByCategoryCardBallsCount",
                  "⚪",
                  "home.shopByCategoryCardPopularBadge",
                  "/balls",
                ],
                [
                  "home.shopByCategoryCardBagsTitle",
                  "home.shopByCategoryCardBagsDesc",
                  "home.shopByCategoryCardBagsCount",
                  "🎒",
                  "",
                  "/bags",
                ],
                [
                  "home.shopByCategoryCardApparelTitle",
                  "home.shopByCategoryCardApparelDesc",
                  "home.shopByCategoryCardApparelCount",
                  "👕",
                  "",
                  "/apparel",
                ],
              ].map(([titleKey, descKey, countKey, emoji, badgeKey, to]) => (
                <Link
                  key={to}
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
                      {t(countKey)}
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

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (readStoredToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit: React.FormEventHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await callAuthMutation(
      mode,
      email,
      password,
      phone || undefined,
    );
    setLoading(false);

    if (result.error || !result.token) {
      setError(result.error ?? "Failed to authenticate");
      return;
    }

    persistToken(result.token);
    navigate("/", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gl-page)] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-900/60">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            GreenLinks Golf
          </h1>
          <div className="inline-flex items-center rounded-full bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === "login"
                  ? "bg-emerald-500 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                mode === "signup"
                  ? "bg-emerald-500 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-300">
          {mode === "signup"
            ? "Create your account to unlock your personalized golf dashboard."
            : "Welcome back. Continue to your account page."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Phone number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="+1 555 123 4567"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? mode === "signup"
                ? "Creating account..."
                : "Logging in..."
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

function MyPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPage, setMyPage] = useState<MyPageData | null>(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [activeSection, setActiveSection] = useState<
    | "profile"
    | "orders"
    | "wishlist"
    | "addresses"
    | "payment"
    | "notifications"
    | "security"
    | "settings"
  >("profile");
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<
    MyPageData["savedAddresses"]
  >([]);
  const [accountWishlistItems, setAccountWishlistItems] = useState<
    Array<{
      id: string;
      brand: string;
      name: string;
      price: number;
      originalPrice?: number;
      path: string;
    }>
  >([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(
    null,
  );
  const [editAddress, setEditAddress] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{
      id: string;
      brand: string;
      last4: string;
      expiry: string;
      isDefault: boolean;
    }>
  >([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    brand: "",
    number: "",
    expiry: "",
    isDefault: false,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    orderUpdates: true,
    promotions: true,
    restockAlerts: true,
    newsletter: false,
  });
  const [securityPrefs, setSecurityPrefs] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState({
    currency: "USD",
    language: normalizeLang(i18n.language),
    compactMode: false,
    reducedMotion: false,
  });
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    fetchMyPage(token).then((result) => {
      if (result.error || !result.data) {
        const message = result.error ?? "Unable to load account details";
        const shouldLogout =
          /unauthorized|invalid token|invalid access token|jwt/i.test(message);
        if (shouldLogout) {
          clearToken();
          setError(t("myPage.sessionExpired"));
          navigate("/", { replace: true });
        } else {
          // Don't force logout on transient backend errors (500, schema drift, etc.).
          setError(message);
          setLoading(false);
        }
        return;
      }
      setMyPage(result.data);
      setLoading(false);
    });
  }, [navigate, t]);

  useEffect(() => {
    if (!myPage) return;
    setFirstName(myPage.user.firstName ?? "");
    setLastName(myPage.user.lastName ?? "");
    setPhone(myPage.user.phone ?? "");
    setSavedAddresses(myPage.savedAddresses);
    setPaymentMethods([
      {
        id: "pm-visa-1",
        brand: "Visa",
        last4: "4242",
        expiry: "08/28",
        isDefault: true,
      },
      {
        id: "pm-mastercard-1",
        brand: "Mastercard",
        last4: "5511",
        expiry: "11/27",
        isDefault: false,
      },
    ]);

    const keyBase = myPage.user.email.toLowerCase();
    try {
      const paymentRaw = localStorage.getItem(`mypage_payment_${keyBase}`);
      if (paymentRaw) {
        const parsed = JSON.parse(paymentRaw);
        if (Array.isArray(parsed)) {
          setPaymentMethods(parsed);
        }
      }
      const notificationRaw = localStorage.getItem(
        `mypage_notifications_${keyBase}`,
      );
      if (notificationRaw) {
        setNotificationPrefs(JSON.parse(notificationRaw));
      }
      const securityRaw = localStorage.getItem(`mypage_security_${keyBase}`);
      if (securityRaw) {
        setSecurityPrefs(JSON.parse(securityRaw));
      }
      const settingsRaw = localStorage.getItem(`mypage_settings_${keyBase}`);
      if (settingsRaw) {
        const parsed = JSON.parse(settingsRaw);
        if (parsed && typeof parsed === "object") {
          const next = parsed as Partial<typeof appSettings> & {
            language?: string;
          };
          setAppSettings((current) => ({
            ...current,
            ...next,
            language: normalizeLang(next.language ?? current.language),
          }));
        }
      }
    } catch {
      // Keep defaults if parsing fails.
    }
  }, [myPage]);

  useEffect(() => {
    const currentLang = normalizeLang(i18n.language);
    setAppSettings((value) =>
      value.language === currentLang
        ? value
        : { ...value, language: currentLang },
    );
  }, [i18n.language]);

  useEffect(() => {
    if (!myPage) return;
    const keyBase = myPage.user.email.toLowerCase();
    localStorage.setItem(
      `mypage_payment_${keyBase}`,
      JSON.stringify(paymentMethods),
    );
  }, [paymentMethods, myPage]);

  useEffect(() => {
    if (!myPage) return;
    const keyBase = myPage.user.email.toLowerCase();
    localStorage.setItem(
      `mypage_notifications_${keyBase}`,
      JSON.stringify(notificationPrefs),
    );
  }, [notificationPrefs, myPage]);

  useEffect(() => {
    if (!myPage) return;
    const keyBase = myPage.user.email.toLowerCase();
    localStorage.setItem(
      `mypage_security_${keyBase}`,
      JSON.stringify(securityPrefs),
    );
  }, [securityPrefs, myPage]);

  useEffect(() => {
    if (!myPage) return;
    const keyBase = myPage.user.email.toLowerCase();
    localStorage.setItem(
      `mypage_settings_${keyBase}`,
      JSON.stringify(appSettings),
    );
  }, [appSettings, myPage]);

  useEffect(() => {
    if (!myPage) return;

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
      setAccountWishlistItems(hydrated);
    };

    const onWishlistChanged = () => {
      void syncWishlist();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_KEY) {
        void syncWishlist();
      }
    };

    void syncWishlist();
    window.addEventListener(
      "wishlist:changed",
      onWishlistChanged as EventListener,
    );
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        "wishlist:changed",
        onWishlistChanged as EventListener,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, [myPage]);

  const initials = useMemo(() => {
    if (!myPage?.displayName) {
      return "GM";
    }
    return myPage.displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }, [myPage?.displayName]);

  const signOut = () => {
    clearToken();
    navigate("/", { replace: true });
  };

  const saveProfile = async () => {
    if (!myPage) return;
    const token = readStoredToken();
    if (!token) {
      setProfileMessage(t("myPage.sessionExpired"));
      return;
    }
    setIsSavingProfile(true);
    setProfileMessage(null);

    const result = await updateMyProfile(token, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    });

    if (result.error || !result.data) {
      setProfileMessage(
        result.error ?? t("myPage.errorSaveProfileChanges"),
      );
      setIsSavingProfile(false);
      return;
    }

    setMyPage(result.data);
    setIsEditingProfile(false);
    setProfileMessage(t("myPage.profileUpdated"));
    setIsSavingProfile(false);
  };

  const addAddress = () => {
    if (!newAddress.label || !newAddress.line1 || !newAddress.city) return;
    const nextAddress = {
      ...newAddress,
      line2: newAddress.line2 || undefined,
    };
    setSavedAddresses((current) => {
      if (nextAddress.isDefault) {
        return [
          { ...nextAddress, isDefault: true },
          ...current.map((address) => ({
            ...address,
            isDefault: false,
          })),
        ];
      }
      return [...current, nextAddress];
    });
    setShowAddAddress(false);
    setNewAddress({
      label: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
  };

  const startEditAddress = (index: number) => {
    const address = savedAddresses[index];
    if (!address) return;
    setEditingAddressIndex(index);
    setShowAddAddress(false);
    setEditAddress({
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
  };

  const cancelEditAddress = () => {
    setEditingAddressIndex(null);
    setEditAddress({
      label: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
  };

  const saveEditedAddress = () => {
    if (editingAddressIndex === null) return;
    if (!editAddress.label || !editAddress.line1 || !editAddress.city) return;

    const nextAddress = {
      ...editAddress,
      line2: editAddress.line2 || undefined,
    };

    setSavedAddresses((current) =>
      current.map((address, index) => {
        if (index === editingAddressIndex) {
          return nextAddress;
        }
        if (nextAddress.isDefault) {
          return { ...address, isDefault: false };
        }
        return address;
      }),
    );

    cancelEditAddress();
  };

  const deleteAddress = (indexToDelete: number) => {
    const confirmed = window.confirm(
      t("myPage.confirmDeleteAddress"),
    );
    if (!confirmed) return;

    setSavedAddresses((current) =>
      current.filter((_, index) => index !== indexToDelete),
    );
    if (editingAddressIndex === indexToDelete) {
      cancelEditAddress();
    }
  };

  const removeFromAccountWishlist = (id: string) => {
    const next = readWishlistIds().filter((wishlistId) => wishlistId !== id);
    persistWishlistIds(next);
    window.dispatchEvent(new Event("wishlist:changed"));
  };

  const addPaymentMethod = () => {
    const digits = newPayment.number.replace(/\D/g, "");
    if (digits.length < 12 || !newPayment.brand || !newPayment.expiry) return;
    const card = {
      id: `pm-${Date.now()}`,
      brand: newPayment.brand,
      last4: digits.slice(-4),
      expiry: newPayment.expiry,
      isDefault: newPayment.isDefault,
    };
    setPaymentMethods((current) => {
      const base = card.isDefault
        ? current.map((item) => ({ ...item, isDefault: false }))
        : current;
      return [...base, card];
    });
    setShowAddPayment(false);
    setNewPayment({ brand: "", number: "", expiry: "", isDefault: false });
  };

  const setDefaultPayment = (id: string) => {
    setPaymentMethods((current) =>
      current.map((item) => ({ ...item, isDefault: item.id === id })),
    );
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((current) => current.filter((item) => item.id !== id));
  };

  const saveSecurity = () => {
    if (securityForm.newPassword.length < 6) {
      setSecurityMessage(t("myPage.securityPasswordTooShort"));
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage(t("myPage.securityPasswordMismatch"));
      return;
    }
    setSecurityMessage(t("myPage.securityUpdated"));
    setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--gl-page)] text-slate-900 dark:text-slate-100">
        {t("myPage.loading")}
      </main>
    );
  }

  if (error || !myPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--gl-page)] text-red-400">
        {error ?? t("myPage.errorLoad")}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={accountSearch}
        onSearchChange={setAccountSearch}
        searchPlaceholder={t("search.placeholderNav")}
      />

      <main className="mx-auto max-w-7xl px-4 py-7">
        <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">
          {t("myPage.breadcrumbHome")} &nbsp;&gt;&nbsp;{" "}
          {t("myPage.breadcrumbAccount")}
        </p>
        <h1 className="mb-7 text-5xl font-semibold tracking-tight text-[var(--gl-heading)]">
          {t("myPage.title")}
        </h1>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          <aside>
            <div className="mb-4 rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e] text-base font-bold text-[#05230f]">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-[var(--gl-heading)]">
                    {myPage.displayName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{myPage.user.email}</p>
                  <p className="mt-0.5 text-xs text-amber-400">
                    ✦ {myPage.memberTier}
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-1.5 text-sm">
              {[
                ["myPage.profile", "profile"],
                ["myPage.orders", "orders"],
                ["myPage.wishlist", "wishlist"],
                ["myPage.addresses", "addresses"],
                ["myPage.payment", "payment"],
                ["myPage.notifications", "notifications"],
                ["myPage.security", "security"],
                ["myPage.settings", "settings"],
              ].map((item) => (
                <li key={item[1]}>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(
                        item[1] as
                          | "profile"
                          | "orders"
                          | "wishlist"
                          | "addresses"
                          | "payment"
                          | "notifications"
                          | "security"
                          | "settings",
                      )
                    }
                    className={`w-full rounded-xl px-4 py-2.5 text-left ${
                      activeSection === item[1]
                        ? "bg-[#22c55e] font-semibold text-[#042210]"
                        : "text-slate-800 dark:text-slate-200 hover:bg-[var(--gl-hover)]"
                    }`}
                  >
                    {t(item[0])}
                  </button>
                </li>
              ))}
              {myPage.user.role === "ADMIN" ? (
                <li>
                  <Link
                    to="/admin"
                    className="block w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[var(--gl-accent-bright)] hover:bg-[var(--gl-hover)]"
                  >
                    {t("myPage.goAdmin")}
                  </Link>
                </li>
              ) : null}
              <li>
                <button
                  type="button"
                  onClick={signOut}
                  className="mt-1 rounded-xl px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-[#1a0c10]"
                >
                  {t("myPage.signOut")}
                </button>
              </li>
            </ul>
          </aside>

          <section className="space-y-5">
            {activeSection === "profile" || activeSection === "orders" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 md:hidden">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("myPage.member")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--gl-heading)]">
                    {myPage.memberTier}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("myPage.totalOrders")}
                  </p>
                  <p className="mt-1 text-4xl font-semibold leading-tight text-[var(--gl-heading)]">
                    {myPage.stats.totalOrders}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("myPage.wishlistItems")}
                  </p>
                  <p className="mt-1 text-4xl font-semibold leading-tight text-[var(--gl-heading)]">
                    {accountWishlistItems.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 md:col-span-2 lg:col-span-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("myPage.rewardPoints")}
                  </p>
                  <p className="mt-1 text-4xl font-semibold leading-tight text-[var(--gl-heading)]">
                    {myPage.stats.rewardPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : null}

            {activeSection === "profile" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="flex items-center justify-between border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.personalInfo")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((current) => !current)}
                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                  >
                    {isEditingProfile ? t("myPage.cancel") : t("myPage.edit")}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3">
                    <p className="text-xs text-slate-500">{t("myPage.firstName")}</p>
                    {isEditingProfile ? (
                      <input
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {myPage.displayName.split(" ")[0] ?? myPage.displayName}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3">
                    <p className="text-xs text-slate-500">{t("myPage.lastName")}</p>
                    {isEditingProfile ? (
                      <input
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {myPage.displayName.split(" ").slice(1).join(" ") ||
                          "-"}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3">
                    <p className="text-xs text-slate-500">
                      {t("myPage.emailAddress")}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {myPage.user.email}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3">
                    <p className="text-xs text-slate-500">{t("auth.phone")}</p>
                    {isEditingProfile ? (
                      <input
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="mt-1 w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1 text-sm text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {myPage.user.phone || t("myPage.phoneNotSet")}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 sm:col-span-1">
                    <p className="text-xs text-slate-500">{t("myPage.handicap")}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">12.4</p>
                  </div>
                  {isEditingProfile ? (
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={isSavingProfile}
                        className="inline-flex rounded-md bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#042210] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingProfile ? t("myPage.saving") : t("myPage.saveChanges")}
                      </button>
                    </div>
                  ) : null}
                  {profileMessage ? (
                    <p className="sm:col-span-2 text-sm text-slate-600 dark:text-slate-400">
                      {profileMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeSection === "orders" || activeSection === "profile" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="flex items-center justify-between border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.recentOrders")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAllOrders((current) => !current)}
                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                  >
                    {showAllOrders ? t("myPage.showLess") : t("home.viewAll")}
                  </button>
                </div>
                <div className="space-y-3 p-5">
                  {myPage.recentOrders.length === 0 ? (
                    <p className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-3 text-sm text-slate-600 dark:text-slate-400">
                      {t("myPage.noRecentOrders")}
                    </p>
                  ) : (
                    (showAllOrders
                      ? myPage.recentOrders
                      : myPage.recentOrders.slice(0, 2)
                    ).map((order) => (
                      <div
                        key={order.orderNumber}
                        className="flex flex-col gap-2 rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.orderDate} | {order.itemCount} items
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              order.status === "Delivered"
                                ? "bg-[#11381f] text-[#61f59d]"
                                : order.status === "Shipped"
                                  ? "bg-[#14334c] text-[#80d5ff]"
                                  : "bg-[#3a2a12] text-[#ffd48a]"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            ${order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {activeSection === "wishlist" ||
            activeSection === "addresses" ||
            activeSection === "profile" ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {activeSection === "wishlist" || activeSection === "profile" ? (
                  <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                    <div className="flex items-center justify-between border-b border-[var(--gl-border-strong)] px-5 py-4">
                      <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                        {t("myPage.wishlist")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => navigate("/wishlist")}
                        className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      >
                        {t("home.viewAll")}
                      </button>
                    </div>
                    <div className="space-y-3 p-5">
                      {accountWishlistItems.length === 0 ? (
                        <p className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-3 text-sm text-slate-600 dark:text-slate-400">
                          {t("drawer.emptyWishlist")}
                        </p>
                      ) : (
                        accountWishlistItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-3"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gl-avatar)] text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {item.brand[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                                {item.brand}
                              </p>
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {item.name}
                              </p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                ${item.price.toFixed(2)}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  removeFromAccountWishlist(item.id)
                                }
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-colors hover:bg-[#1a0c10] hover:text-rose-400"
                                aria-label={`Remove ${item.name} from wishlist`}
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
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {activeSection === "addresses" ||
                activeSection === "profile" ? (
                  <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                    <div className="flex items-center justify-between border-b border-[var(--gl-border-strong)] px-5 py-4">
                      <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                        {t("myPage.savedAddressesTitle")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress((current) => !current)}
                        className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                      >
                        {showAddAddress ? t("myPage.cancel") : t("myPage.addNew")}
                      </button>
                    </div>
                    <div className="space-y-3 p-5">
                      {showAddAddress ? (
                        <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              value={newAddress.label}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  label: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.addressLabelPlaceholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={newAddress.line1}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  line1: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.addressLine1Placeholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={newAddress.line2}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  line2: event.target.value,
                                }))
                              }
                              placeholder={t(
                                "myPage.addressLine2OptionalPlaceholder",
                              )}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 sm:col-span-2"
                            />
                            <input
                              value={newAddress.city}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  city: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.cityPlaceholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={newAddress.region}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  region: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.regionStatePlaceholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={newAddress.postalCode}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  postalCode: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.postalCodePlaceholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={newAddress.country}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  country: event.target.value,
                                }))
                              }
                              placeholder={t("myPage.countryPlaceholder")}
                              className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={newAddress.isDefault}
                              onChange={(event) =>
                                setNewAddress((value) => ({
                                  ...value,
                                  isDefault: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                            />
                            {t("myPage.makeDefault")}
                          </label>
                          <button
                            type="button"
                            onClick={addAddress}
                            className="mt-3 rounded-md bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-[#042210]"
                          >
                            {t("myPage.saveAddress")}
                          </button>
                        </div>
                      ) : null}
                      {savedAddresses.map((address, index) => (
                        <div
                          key={`${address.label}-${index}`}
                          className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4"
                        >
                          {editingAddressIndex === index ? (
                            <div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                  value={editAddress.label}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      label: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.addressLabelPlaceholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <input
                                  value={editAddress.line1}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      line1: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.addressLine1Placeholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <input
                                  value={editAddress.line2}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      line2: event.target.value,
                                    }))
                                  }
                              placeholder={t(
                                "myPage.addressLine2OptionalPlaceholder",
                              )}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 sm:col-span-2"
                                />
                                <input
                                  value={editAddress.city}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      city: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.cityPlaceholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <input
                                  value={editAddress.region}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      region: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.regionStatePlaceholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <input
                                  value={editAddress.postalCode}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      postalCode: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.postalCodePlaceholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <input
                                  value={editAddress.country}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      country: event.target.value,
                                    }))
                                  }
                              placeholder={t("myPage.countryPlaceholder")}
                                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <input
                                  type="checkbox"
                                  checked={editAddress.isDefault}
                                  onChange={(event) =>
                                    setEditAddress((value) => ({
                                      ...value,
                                      isDefault: event.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                                />
                            {t("myPage.makeDefault")}
                              </label>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={saveEditedAddress}
                                  className="rounded-md bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-[#042210]"
                                >
                              {t("myPage.save")}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditAddress}
                                  className="rounded-md border border-[var(--gl-border)] px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-white"
                                >
                              {t("myPage.cancel")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {address.isDefault && (
                                    <span className="rounded-full bg-[#11381f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#61f59d]">
                                      {t("myPage.default")}
                                    </span>
                                  )}
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {address.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEditAddress(index)}
                                    className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                                  >
                                    {t("myPage.editAction")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteAddress(index)}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-700 dark:text-slate-300 transition-colors hover:bg-[#1a0c10] hover:text-rose-400"
                                    aria-label={t("myPage.deleteAddressAria")}
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
                              <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                                {address.line1}
                                {address.line2 ? (
                                  <>
                                    <br />
                                    {address.line2}
                                  </>
                                ) : null}
                                <br />
                                {address.city}, {address.region}{" "}
                                {address.postalCode}
                                <br />
                                {address.country}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeSection === "payment" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="flex items-center justify-between border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.payment")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddPayment((current) => !current)}
                    className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                  >
                    {showAddPayment ? t("myPage.cancel") : t("myPage.addNew")}
                  </button>
                </div>
                <div className="space-y-3 p-5">
                  {showAddPayment ? (
                    <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                          value={newPayment.brand}
                          onChange={(event) =>
                            setNewPayment((value) => ({
                              ...value,
                              brand: event.target.value,
                            }))
                          }
                          className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                        >
                          <option value="" disabled>
                            {t("myPage.cardBrandPlaceholder")}
                          </option>
                          <option value="Visa">{t("myPage.cardBrandVisa")}</option>
                          <option value="Mastercard">{t("myPage.cardBrandMastercard")}</option>
                          <option value="American Express">{t("myPage.cardBrandAmex")}</option>
                          <option value="Discover">{t("myPage.cardBrandDiscover")}</option>
                          <option value="JCB">{t("myPage.cardBrandJcb")}</option>
                          <option value="Domestic Card">{t("myPage.cardBrandDomestic")}</option>
                        </select>
                        <input
                          value={newPayment.number}
                          onChange={(event) =>
                            setNewPayment((value) => ({
                              ...value,
                              number: event.target.value,
                            }))
                          }
                          placeholder={t("myPage.cardNumberPlaceholder")}
                          className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                        />
                        <input
                          value={newPayment.expiry}
                          onChange={(event) =>
                            setNewPayment((value) => ({
                              ...value,
                              expiry: event.target.value,
                            }))
                          }
                          placeholder={t("myPage.expiryPlaceholder")}
                          className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <label className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <input
                          type="checkbox"
                          checked={newPayment.isDefault}
                          onChange={(event) =>
                            setNewPayment((value) => ({
                              ...value,
                              isDefault: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                        />
                        {t("myPage.setAsDefaultPaymentMethod")}
                      </label>
                      <button
                        type="button"
                        onClick={addPaymentMethod}
                        className="mt-3 rounded-md bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-[#042210]"
                      >
                          {t("myPage.savePaymentMethod")}
                      </button>
                    </div>
                  ) : null}
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center gap-3 rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gl-avatar)] text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {method.brand[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Exp {method.expiry}
                        </p>
                      </div>
                      {method.isDefault ? (
                        <span className="ml-auto rounded-full bg-[#11381f] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#61f59d]">
                          {t("myPage.default")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDefaultPayment(method.id)}
                          className="ml-auto text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                        >
                          {t("myPage.makeDefault")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(method.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        {t("myPage.remove")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "notifications" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.notificationPreferencesTitle")}
                  </h2>
                </div>
                <div className="space-y-3 p-5">
                  {[
                    [
                      "orderUpdates",
                      "myPage.notification.orderUpdates",
                    ],
                    ["promotions", "myPage.notification.promotions"],
                    ["restockAlerts", "myPage.notification.restockAlerts"],
                    ["newsletter", "myPage.notification.newsletter"],
                  ].map(([key, labelKey]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 text-sm"
                    >
                      <span className="text-slate-900 dark:text-slate-100">
                        {t(labelKey)}
                      </span>
                      <input
                        type="checkbox"
                        checked={
                          notificationPrefs[
                            key as keyof typeof notificationPrefs
                          ]
                        }
                        onChange={(event) =>
                          setNotificationPrefs((value) => ({
                            ...value,
                            [key]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "security" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.security")}
                  </h2>
                </div>
                <div className="space-y-4 p-5">
                  <label className="flex items-center justify-between rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 text-sm">
                    <span className="text-slate-900 dark:text-slate-100">
                      {t("myPage.twoFactorAuthentication")}
                    </span>
                    <input
                      type="checkbox"
                      checked={securityPrefs.twoFactorEnabled}
                      onChange={(event) =>
                        setSecurityPrefs((value) => ({
                          ...value,
                          twoFactorEnabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                    />
                  </label>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                      {t("myPage.sessionTimeout")}
                    </p>
                    <select
                      value={securityPrefs.sessionTimeout}
                      onChange={(event) =>
                        setSecurityPrefs((value) => ({
                          ...value,
                          sessionTimeout: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="5">{t("myPage.sessionTimeoutOption5")}</option>
                      <option value="10">{t("myPage.sessionTimeoutOption10")}</option>
                      <option value="15">{t("myPage.sessionTimeoutOption15")}</option>
                      <option value="30">{t("myPage.sessionTimeoutOption30")}</option>
                      <option value="45">{t("myPage.sessionTimeoutOption45")}</option>
                      <option value="60">{t("myPage.sessionTimeoutOption60")}</option>
                      <option value="90">{t("myPage.sessionTimeoutOption90")}</option>
                      <option value="120">{t("myPage.sessionTimeoutOption120")}</option>
                      <option value="180">{t("myPage.sessionTimeoutOption180")}</option>
                      <option value="240">{t("myPage.sessionTimeoutOption240")}</option>
                      <option value="480">{t("myPage.sessionTimeoutOption480")}</option>
                      <option value="1440">{t("myPage.sessionTimeoutOption1440")}</option>
                    </select>
                  </div>
                  <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                    <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
                      {t("myPage.changePassword")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        type="password"
                        placeholder={t("myPage.currentPasswordPlaceholder")}
                        value={securityForm.currentPassword}
                        onChange={(event) =>
                          setSecurityForm((value) => ({
                            ...value,
                            currentPassword: event.target.value,
                          }))
                        }
                        className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="password"
                        placeholder={t("myPage.newPasswordPlaceholder")}
                        value={securityForm.newPassword}
                        onChange={(event) =>
                          setSecurityForm((value) => ({
                            ...value,
                            newPassword: event.target.value,
                          }))
                        }
                        className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="password"
                        placeholder={t("myPage.confirmPasswordPlaceholder")}
                        value={securityForm.confirmPassword}
                        onChange={(event) =>
                          setSecurityForm((value) => ({
                            ...value,
                            confirmPassword: event.target.value,
                          }))
                        }
                        className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveSecurity}
                      className="mt-3 rounded-md bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-[#042210]"
                    >
                      {t("myPage.updateSecurity")}
                    </button>
                    {securityMessage ? (
                      <p className="mt-2 text-xs text-[var(--gl-accent-text)]">
                        {securityMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSection === "settings" ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)]">
                <div className="border-b border-[var(--gl-border-strong)] px-5 py-4">
                  <h2 className="text-2xl font-semibold text-[var(--gl-heading)]">
                    {t("myPage.settings")}
                  </h2>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                      <p className="mb-1 text-xs text-slate-500">{t("myPage.currency")}</p>
                      <select
                        value={appSettings.currency}
                        onChange={(event) =>
                          setAppSettings((value) => ({
                            ...value,
                            currency: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] p-4">
                      <p className="mb-1 text-xs text-slate-500">{t("myPage.language")}</p>
                      <select
                        value={appSettings.language}
                        onChange={(event) => {
                          const nextLanguage = normalizeLang(event.target.value);
                          setAppSettings((value) => ({
                            ...value,
                            language: nextLanguage,
                          }));
                          void i18n.changeLanguage(nextLanguage);
                        }}
                        className="w-full rounded-md border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                      >
                        <option value="en">{t("lang.en")}</option>
                        <option value="ko">{t("lang.ko")}</option>
                        <option value="uz">{t("lang.uz")}</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center justify-between rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 text-sm">
                    <span className="text-slate-900 dark:text-slate-100">
                      {t("myPage.compactMode")}
                    </span>
                    <input
                      type="checkbox"
                      checked={appSettings.compactMode}
                      onChange={(event) =>
                        setAppSettings((value) => ({
                          ...value,
                          compactMode: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-[var(--gl-border-strong)] bg-[var(--gl-deep)] px-4 py-3 text-sm">
                    <span className="text-slate-900 dark:text-slate-100">
                      {t("myPage.reducedMotion")}
                    </span>
                    <input
                      type="checkbox"
                      checked={appSettings.reducedMotion}
                      onChange={(event) =>
                        setAppSettings((value) => ({
                          ...value,
                          reducedMotion: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSettingsMessage(t("myPage.settingsSaved"))}
                    className="rounded-md bg-[#22c55e] px-3 py-1.5 text-xs font-semibold text-[#042210]"
                  >
                    {t("myPage.saveSettings")}
                  </button>
                  {settingsMessage ? (
                    <p className="text-xs text-[var(--gl-accent-text)]">{settingsMessage}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SalePage() {
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
        status === "exists"
          ? t("sale.emailExists")
          : t("sale.emailSubscribed"),
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

function ClubsPage() {
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

function BallsPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("FEATURED");
  const [page, setPage] = useState(1);
  const [allBalls, setAllBalls] = useState<BallItem[]>([]);
  const [balls, setBalls] = useState<BallItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const perPage = 9;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allBalls) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allBalls]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allBalls) {
      map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allBalls]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBrand, selectedPrice, sortBy]);

  useEffect(() => {
    fetchBallProducts({ limit: 30, page: 1 }).then((result) => {
      if (result.data) {
        setAllBalls(result.data.items);
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

    fetchBallProducts({
      category: selectedCategory,
      search: searchQuery,
      brand: selectedBrand,
      priceRange: mapPriceRange(),
      sort: sortBy,
      page,
      limit: perPage,
    }).then((result) => {
      if (result.error || !result.data) {
        setError(result.error ?? t("catalog.failedBalls"));
        setBalls([]);
        setTotal(0);
      } else {
        setBalls(result.data.items);
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
              {t("balls.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              {t("balls.sub")}
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
                        name="balls-price"
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
                {t("catalog.loadingBalls")}
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
                {balls.map((item) => {
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
                                `${item.category} golf balls`,
                              )
                            }
                            alt={item.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = "/products/ball.jpg";
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
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#03210f]"
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
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {safeRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({safeReviews})
                          </span>
                        </div>
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

function BagsPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("FEATURED");
  const [page, setPage] = useState(1);
  const [allBags, setAllBags] = useState<BagItem[]>([]);
  const [bags, setBags] = useState<BagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const perPage = 9;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allBags) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allBags]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allBags) {
      map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allBags]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBrand, selectedPrice, sortBy]);

  useEffect(() => {
    fetchBagProducts({ limit: 30, page: 1 }).then((result) => {
      if (result.data) {
        setAllBags(result.data.items);
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

    fetchBagProducts({
      category: selectedCategory,
      search: searchQuery,
      brand: selectedBrand,
      priceRange: mapPriceRange(),
      sort: sortBy,
      page,
      limit: perPage,
    }).then((result) => {
      if (result.error || !result.data) {
        setError(result.error ?? t("catalog.failedBags"));
        setBags([]);
        setTotal(0);
      } else {
        setBags(result.data.items);
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
              {t("bags.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              {t("bags.sub")}
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
                        name="bags-price"
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
                {t("catalog.loadingBags")}
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
                {bags.map((item) => {
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
                                `${item.category} golf bag`,
                              )
                            }
                            alt={item.name}
                            loading="lazy"
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
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#03210f]"
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
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {safeRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({safeReviews})
                          </span>
                        </div>
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

function ApparelPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("FEATURED");
  const [page, setPage] = useState(1);
  const [allApparel, setAllApparel] = useState<ApparelItem[]>([]);
  const [apparel, setApparel] = useState<ApparelItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const perPage = 9;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allApparel) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allApparel]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allApparel) {
      map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allApparel]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBrand, selectedPrice, sortBy]);

  useEffect(() => {
    fetchApparelProducts({ limit: 30, page: 1 }).then((result) => {
      if (result.data) {
        setAllApparel(result.data.items);
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

    fetchApparelProducts({
      category: selectedCategory,
      search: searchQuery,
      brand: selectedBrand,
      priceRange: mapPriceRange(),
      sort: sortBy,
      page,
      limit: perPage,
    }).then((result) => {
      if (result.error || !result.data) {
        setError(result.error ?? t("catalog.failedApparel"));
        setApparel([]);
        setTotal(0);
      } else {
        setApparel(result.data.items);
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
      <TopNav
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("search.placeholderNav")}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#22c55e]/20 via-[var(--gl-page)] to-[var(--gl-page)] py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
              {t("apparel.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              {t("apparel.sub")}
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>{t("catalog.products", { count: total })}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-40 border-b border-[var(--gl-border)] bg-[var(--gl-page)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
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
                        name="apparel-price"
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
                {t("catalog.loadingApparel")}
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
                {apparel.map((item) => {
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
                                `${item.category} golf apparel`,
                              )
                            }
                            alt={item.name}
                            loading="lazy"
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
                            className="w-full rounded-md bg-[#22c55e] px-3 py-2 text-sm font-medium text-[#03210f]"
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
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {safeRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ({safeReviews})
                          </span>
                        </div>
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

function AccessoriesPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedPrice, setSelectedPrice] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "FEATURED" | "PRICE_ASC" | "PRICE_DESC" | "RATING_DESC"
  >("FEATURED");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [allAccessories, setAllAccessories] = useState<AccessoryItem[]>([]);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 18;

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allAccessories) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allAccessories]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of allAccessories) {
      map.set(item.brand, (map.get(item.brand) ?? 0) + 1);
    }
    return Array.from(map.entries());
  }, [allAccessories]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedBrand, selectedPrice, sortBy]);

  useEffect(() => {
    fetchAccessoryProducts({ limit: 30, page: 1 }).then((result) => {
      if (result.data) {
        setAllAccessories(result.data.items);
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

    fetchAccessoryProducts({
      category: selectedCategory,
      search: searchQuery,
      brand: selectedBrand,
      priceRange: mapPriceRange(),
      sort: sortBy,
      page,
      limit: perPage,
    }).then((result) => {
      if (result.error || !result.data) {
        setError(result.error ?? t("catalog.failedAccessories"));
        setAccessories([]);
        setTotal(0);
      } else {
        setAccessories(result.data.items);
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
      <TopNav
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("search.placeholderNav")}
      />

      <section className="relative overflow-hidden border-b border-[var(--gl-border)] bg-gradient-to-b from-[var(--gl-hero-from)] via-[var(--gl-surface)] to-[var(--gl-page)] py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.16),transparent_52%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--gl-heading)] sm:text-5xl">
            {t("accessories.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-700 dark:text-slate-300 sm:text-lg">
            {t("accessories.sub")}
          </p>
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
            {t("catalog.products", { count: total })}
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-36 space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-slate-900 dark:text-slate-100">
                  {t("catalog.category")}
                </h3>
                <div className="space-y-2">
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCategory === "All"}
                      onChange={() =>
                        setSelectedCategory(
                          selectedCategory === "All" ? "" : "All",
                        )
                      }
                      className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                      {t("catalog.all")}
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      ({allAccessories.length})
                    </span>
                  </label>
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
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrand === "All"}
                      onChange={() =>
                        setSelectedBrand(selectedBrand === "All" ? "" : "All")
                      }
                      className="h-4 w-4 rounded border-[var(--gl-border)] bg-[var(--gl-surface)] text-[#22c55e]"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                      {t("catalog.all")}
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      ({allAccessories.length})
                    </span>
                  </label>
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
                        name="accessories-price"
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

          <section className="flex-1">
            {loading ? (
              <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center text-slate-600 dark:text-slate-400">
                {t("catalog.loadingAccessories")}
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
                {accessories.map((item) => (
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
                        aria-label={t("common.viewProduct", {
                          name: item.name,
                        })}
                      >
                        <img
                          src={
                            item.imageUrl ??
                            getProductImageUrl(
                              item.name,
                              `${item.category} golf accessory`,
                            )
                          }
                          alt={item.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = "/products/rangefinder.jpg";
                          }}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>
                      {item.badge ? (
                        <div className="absolute left-3 top-3 z-10">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              item.badge === "Sale"
                                ? "bg-rose-500 text-white"
                                : item.badge === "New"
                                  ? "bg-[#22c55e] text-[#03210f]"
                                  : "bg-[#163423] text-[var(--gl-accent-text)]"
                            }`}
                          >
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
                        <span className="text-[var(--gl-accent-text)]">★</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.rating.toFixed(1)}
                        </span>
                        <span className="text-slate-500">
                          ({item.reviewCount})
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          ${item.price.toFixed(2)}
                        </span>
                        {typeof item.originalPrice === "number" ? (
                          <span className="text-sm text-slate-500 line-through">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
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
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function WishlistPage() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      brand: string;
      name: string;
      price: number;
      originalPrice?: number;
      category: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncWishlist = async () => {
      setLoading(true);

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
          category: string;
        }
      >();

      for (const item of clubsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }
      for (const item of ballsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }
      for (const item of bagsResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }
      for (const item of apparelResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }
      for (const item of accessoriesResult.data?.items ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }
      for (const item of saleResult.data ?? []) {
        catalog.set(item.id, {
          id: item.id,
          brand: item.brand,
          name: item.name,
          price: item.salePrice,
          originalPrice: item.originalPrice,
          category: item.category,
        });
      }

      const wishlistIds = readWishlistIds();
      const hydrated = wishlistIds
        .map((id) => catalog.get(id))
        .filter(Boolean) as Array<{
        id: string;
        brand: string;
        name: string;
        price: number;
        originalPrice?: number;
        category: string;
      }>;

      if (!cancelled) {
        setItems(hydrated);
        setLoading(false);
      }
    };

    const onWishlistChanged = () => {
      void syncWishlist();
    };

    void syncWishlist();
    window.addEventListener("storage", onWishlistChanged);
    window.addEventListener(
      "wishlist:changed",
      onWishlistChanged as EventListener,
    );
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onWishlistChanged);
      window.removeEventListener(
        "wishlist:changed",
        onWishlistChanged as EventListener,
      );
    };
  }, []);

  const removeFromWishlist = (id: string) => {
    const next = readWishlistIds().filter((wishlistId) => wishlistId !== id);
    persistWishlistIds(next);
    window.dispatchEvent(new Event("wishlist:changed"));
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Wishlist</h1>
          <Link
            to="/"
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Back to Home
          </Link>
        </div>
        {loading ? (
          <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center text-slate-600 dark:text-slate-400">
            Loading wishlist...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-10 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Your wishlist is empty
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Tap the heart icon on any product to save it here.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Link
                to="/sale"
                className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-[#042210]"
              >
                Browse Deals
              </Link>
              <Link
                to="/clubs"
                className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Browse Clubs
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4"
              >
                <Link
                  to={`/product/${item.id}`}
                  className="mb-3 block overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gl-surface)]"
                  aria-label={`View ${item.name}`}
                >
                  <ProductImage
                    name={item.name}
                    category="golf wishlist"
                    imgClassName="h-36 w-full rounded-lg border border-[var(--gl-border-strong)] object-cover transition-opacity hover:opacity-90"
                  />
                </Link>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.brand}</p>
                <Link
                  to={`/product/${item.id}`}
                  className="mt-1 block text-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-[var(--gl-accent-text)]"
                >
                  {item.name}
                </Link>
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
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-[#22c55e] px-3 py-2 text-sm font-semibold text-[#042210]"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.id)}
                    className="w-full rounded-lg border border-rose-600/40 bg-rose-900/15 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-900/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<
    string | null
  >(null);
  const [trustModal, setTrustModal] = useState<
    "shipping" | "returns" | "checkout" | null
  >(null);
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);
  const [projectInfoAnswer, setProjectInfoAnswer] = useState<string | null>(
    null,
  );
  const [projectInfoLoading, setProjectInfoLoading] = useState(false);
  const [projectInfoError, setProjectInfoError] = useState<string | null>(null);
  const [projectInfoMeta, setProjectInfoMeta] = useState<{
    provider?: "openai" | "gemini" | "static";
    model?: string;
    note?:
      | "missing_openai_used_gemini"
      | "openai_failed_used_gemini"
      | "no_ai_available";
  }>({});

  useEffect(() => {
    if (!trustModal && !showProjectInfoModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTrustModal(null);
        setShowProjectInfoModal(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [trustModal, showProjectInfoModal]);

  const fetchProjectInfoOverview = async (clearExisting: boolean) => {
    if (clearExisting) {
      setProjectInfoAnswer(null);
      setProjectInfoMeta({});
    }
    setProjectInfoLoading(true);
    setProjectInfoError(null);
    try {
      const res = await fetch(AI_PROJECT_INFO_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }
      const data = (await res.json()) as {
        answer?: string;
        provider?: "openai" | "gemini" | "static";
        model?: string;
        note?:
          | "missing_openai_used_gemini"
          | "openai_failed_used_gemini"
          | "no_ai_available";
      };
      const answer = data.answer?.trim();
      if (!answer) {
        throw new Error("Empty response");
      }
      setProjectInfoAnswer(answer);
      setProjectInfoMeta({
        provider: data.provider,
        model: data.model,
        note: data.note,
      });
    } catch {
      setProjectInfoError(
        t("product.projectOverviewError"),
      );
    } finally {
      setProjectInfoLoading(false);
    }
  };

  const openProjectInfoModal = () => {
    setShowProjectInfoModal(true);
    if (projectInfoAnswer === null && !projectInfoLoading) {
      void fetchProjectInfoOverview(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError(t("product.notFound"));
      setLoading(false);
      return;
    }

    let decoded = id;
    try {
      decoded = decodeURIComponent(id);
    } catch {
      decoded = id;
    }

    setLoading(true);
    setError(null);
    fetchProductById(decoded).then((result) => {
      if (result.error || !result.data) {
        const err = result.error ?? "";
        const isUuidBackendError = /invalid input syntax for type uuid/i.test(
          err,
        );
        const message =
          err === "LEGACY_OR_INVALID_PRODUCT_ID" || isUuidBackendError
            ? t("product.legacyCartItem")
            : err === "Product not found"
              ? t("product.notFound")
              : (err || t("product.notFound"));
        setError(message);
        setProduct(null);
      } else {
        setProduct(result.data);
      }
      setLoading(false);
    });
  }, [id, t]);

  useEffect(() => {
    if (!product?.description) return;
    const lang = normalizeLang(i18n.language);
    if (lang === "en") {
      setTranslatedDescription(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setTranslatedDescription(null);
      try {
        const prompt = [
          `Translate the following product description into ${lang}.`,
          "Return only the translated text. No quotes, no explanations.",
          "",
          product.description,
        ].join("\n");

        const res = await fetch(AI_CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, language: lang }),
        });

        if (!res.ok) return;
        const data = (await res.json()) as { answer?: string };
        const answer = data.answer?.trim();
        if (!cancelled && answer) setTranslatedDescription(answer);
      } catch {
        // Translation failures should never block the product page.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.description, i18n.language]);

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-48 top-0 h-[min(520px,55vh)] w-[min(520px,90vw)] rounded-full bg-[#22c55e]/[0.11] blur-3xl" />
          <div className="absolute -right-40 bottom-0 h-[min(440px,50vh)] w-[min(440px,85vw)] rounded-full bg-[#d7a422]/[0.09] blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 h-px w-[min(720px,80vw)] -rotate-12 bg-gradient-to-r from-transparent via-[#22c55e]/20 to-transparent" />
        </div>
        <TopNav
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("search.placeholderProduct")}
        />
        <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--gl-border-soft)] bg-[var(--gl-surface-90)] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:border-[#22c55e]/40 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-heading)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
          >
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
              className="transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("product.back")}
          </button>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--gl-border-card)] bg-gradient-to-b from-[var(--gl-hero-from)] via-[var(--gl-surface)] to-[var(--gl-page-deep)] shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)]">
              <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-square">
                <div className="absolute inset-0 bg-[var(--gl-card)]" />
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#22c55e]/10 via-[#22c55e]/5 to-[#d7a422]/10" />
              </div>
              <div className="p-4">
                <div className="h-4 w-[60%] animate-pulse rounded bg-[var(--gl-border)]" />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--gl-border-card)] bg-[var(--gl-surface-95)] p-6 shadow-[0_24px_60px_-28px_rgba(34,197,94,0.12)] backdrop-blur-sm sm:p-8">
              <div className="h-5 w-[55%] animate-pulse rounded bg-[var(--gl-border)]" />
              <div className="mt-3 h-10 w-[90%] animate-pulse rounded bg-[var(--gl-border)]" />
              <div className="mt-4 flex items-center gap-2">
                <div className="h-8 w-[160px] animate-pulse rounded bg-[var(--gl-border)]" />
              </div>
              <div className="mt-6 h-16 w-full animate-pulse rounded-xl bg-[var(--gl-surface-muted)]" />
              <div className="mt-5 h-5 w-[100%] animate-pulse rounded bg-[var(--gl-surface-muted)]" />
              <div className="mt-2 h-5 w-[88%] animate-pulse rounded bg-[var(--gl-surface-muted)]" />
              <div className="mt-2 h-5 w-[76%] animate-pulse rounded bg-[var(--gl-surface-muted)]" />
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="h-12 w-full animate-pulse rounded-xl bg-[#22c55e]/20" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--gl-border)]" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-48 top-0 h-[min(520px,55vh)] w-[min(520px,90vw)] rounded-full bg-[#22c55e]/[0.11] blur-3xl" />
          <div className="absolute -right-40 bottom-0 h-[min(440px,50vh)] w-[min(440px,85vw)] rounded-full bg-[#d7a422]/[0.09] blur-3xl" />
          <div className="absolute bottom-1/3 left-1/3 h-px w-[min(720px,80vw)] -rotate-12 bg-gradient-to-r from-transparent via-[#22c55e]/20 to-transparent" />
        </div>
        <TopNav
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t("search.placeholderProduct")}
        />
        <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--gl-border-soft)] bg-[var(--gl-surface-90)] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:border-[#22c55e]/40 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-heading)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
          >
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
              className="transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t("product.back")}
          </button>

          <div className="relative mx-auto max-w-2xl rounded-3xl border border-rose-200/90 bg-rose-50/95 p-7 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20 dark:shadow-[0_28px_80px_-48px_rgba(244,63,94,0.35)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
                  {t("product.unavailable")}
                </p>
                <p className="mt-2 text-sm text-rose-900 dark:text-rose-200">
                  {error ?? t("product.notFound")}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-300/80 bg-rose-100/80 dark:border-rose-500/30 dark:bg-rose-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-rose-600 dark:text-rose-200"
                  aria-hidden="true"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const addToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    addItemToCart(
      {
        id: product.id,
        brand: product.brand,
        name: product.name,
        imageUrl:
          product.imageUrl ??
          getProductImageUrl(
            product.name,
            `${product.category} golf product`,
          ),
        price: product.price,
        originalPrice: product.originalPrice,
      },
      centerOfElement(event.currentTarget),
    );
  };

  const onSale =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  const saveAmount = onSale ? product.originalPrice! - product.price : 0;
  const fullStars = Math.min(5, Math.round(product.rating));

  const trustModalBody =
    trustModal === "shipping"
      ? t("home.trustShipInfo")
      : trustModal === "returns"
        ? t("home.trustReturnsInfo")
        : trustModal === "checkout"
          ? t("home.trustPayInfo")
          : "";
  const trustModalParagraphs = trustModalBody
    ? trustModalBody.split("\n\n").filter(Boolean)
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-48 top-0 h-[min(520px,55vh)] w-[min(520px,90vw)] rounded-full bg-[#22c55e]/[0.11] blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[min(440px,50vh)] w-[min(440px,85vw)] rounded-full bg-[#d7a422]/[0.09] blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 h-px w-[min(720px,80vw)] -rotate-12 bg-gradient-to-r from-transparent via-[#22c55e]/20 to-transparent" />
      </div>

      <TopNav
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("search.placeholderProduct")}
      />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav
          aria-label={t("product.breadcrumb")}
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
        >
          <Link
            to="/"
            className="transition-colors hover:text-[var(--gl-accent-text)] focus:outline-none focus-visible:text-[var(--gl-accent-text)]"
          >
            {t("product.breadcrumbHome")}
          </Link>
          <span className="text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="max-w-[12rem] truncate text-slate-700 dark:text-slate-300 sm:max-w-none">
            {product.category}
          </span>
          <span className="text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="max-w-[14rem] truncate font-medium text-slate-700 dark:text-slate-300 sm:max-w-md">
            {product.name}
          </span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--gl-border-soft)] bg-[var(--gl-surface-90)] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:border-[#22c55e]/40 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-heading)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
        >
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
            className="transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t("product.back")}
        </button>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
          {/* Image stage */}
          <div className="relative">
            <div
              className="absolute -inset-px rounded-[1.65rem] bg-gradient-to-br from-[#4ade80]/50 via-[#166534]/30 to-[#ca8a04]/35 opacity-90 blur-[2px]"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl border border-[var(--gl-border-card)] bg-gradient-to-b from-[var(--gl-hero-from)] via-[var(--gl-surface)] to-[var(--gl-page-deep)] shadow-[0_28px_80px_-24px_rgba(0,0,0,0.85)]">
              <div className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-square">
                {product.badge ? (
                  <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
                    <span className="inline-flex items-center rounded-full border border-[#22c55e]/45 bg-[var(--gl-deep)]/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-900 shadow-lg backdrop-blur-md dark:text-[#86efac]">
                      {product.badge}
                    </span>
                  </div>
                ) : null}
                <img
                  src={
                    product.imageUrl ??
                    getProductImageUrl(product.name, `${product.category} golf`)
                  }
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-[1.1s] ease-out will-change-transform hover:scale-[1.04]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--gl-page)]/55 via-transparent to-[var(--gl-page)]/25"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--gl-surface-90)] to-transparent"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Purchase panel */}
          <div className="lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-3xl border border-[var(--gl-border-card)] bg-[var(--gl-surface-95)] p-6 shadow-[0_24px_60px_-28px_rgba(34,197,94,0.12)] backdrop-blur-sm sm:p-8">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#22c55e]/[0.07] blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-tl-full bg-[#d7a422]/[0.04]"
                aria-hidden="true"
              />

              <div className="relative flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--gl-raised)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--gl-accent-text)] ring-1 ring-[#22c55e]/20">
                  {product.brand}
                </span>
                <span className="rounded-full border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {product.category}
                </span>
              </div>

              <h1 className="relative mt-5 text-3xl font-bold leading-[1.15] tracking-tight text-[var(--gl-heading)] sm:text-4xl lg:text-[2.45rem] dark:bg-gradient-to-br dark:from-[#f3fff7] dark:via-[#e2f5eb] dark:to-[#86efac] dark:bg-clip-text dark:text-transparent">
                {product.name}
              </h1>

              <div className="relative mt-5 flex flex-wrap items-center gap-3">
                <div
                  className="flex items-center gap-2 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-chip)] px-3 py-2"
                  aria-label={t("product.ratedOutOfFive", {
                    rating: product.rating.toFixed(1),
                  })}
                >
                  <span className="flex gap-0.5 text-amber-400" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={`star-${i}`}
                        className={
                          i < fullStars ? "opacity-100" : "opacity-25"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-500">
                    ({product.reviewCount}{" "}
                    {product.reviewCount === 1
                      ? t("product.review")
                      : t("product.reviews")}
                  </span>
                </div>
              </div>

              <div className="relative mt-7 rounded-2xl border border-[#22c55e]/30 bg-gradient-to-br from-[var(--gl-tile-from)] via-[var(--gl-surface)] to-[var(--gl-tile-to)] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-500">
                    {t("product.yourPrice")}
                  </p>
                  {onSale ? (
                    <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-800 ring-1 ring-rose-500/35 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-500/30">
                      {t("product.sale")}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-4xl font-bold tabular-nums tracking-tight text-[var(--gl-heading)] sm:text-[2.75rem]">
                    ${product.price.toFixed(2)}
                  </span>
                  {onSale ? (
                    <>
                      <span className="text-lg text-slate-500 line-through tabular-nums">
                        ${product.originalPrice!.toFixed(2)}
                      </span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-[#86efac]">
                        {t("product.youSave", { amount: saveAmount.toFixed(2) })}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="relative mt-5 rounded-2xl border border-[var(--gl-border-muted)] bg-[var(--gl-deep)] p-3 dark:bg-[#080f0c]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-500">
                    {t("product.overview")}
                  </p>
                  <button
                    type="button"
                    onClick={() => openProjectInfoModal()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#22c55e]/40 bg-[var(--gl-raised)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800 shadow-sm transition hover:border-[#22c55e]/60 hover:bg-[var(--gl-hover)] hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/45 dark:text-[#86efac] dark:hover:text-[#bbf7d0]"
                    aria-haspopup="dialog"
                    aria-expanded={showProjectInfoModal}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-700 dark:text-[var(--gl-accent-text)]"
                      aria-hidden="true"
                    >
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
                      <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z" />
                    </svg>
                    {t("product.askChatgpt")}
                  </button>
                </div>
                <p className="mt-1 border-l-2 border-[#22c55e]/60 pl-4 text-sm leading-normal text-slate-700 dark:text-slate-400">
                  {translatedDescription ?? product.description}
                </p>
              </div>

              <ul className="relative mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:items-stretch">
                <li className="flex min-w-0">
                  <button
                    type="button"
                    onClick={() => setTrustModal("shipping")}
                    className="group flex h-full min-h-[3.25rem] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2.5 text-left text-[11px] font-medium leading-snug text-slate-800 dark:text-slate-200 transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-accent-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                    aria-haspopup="dialog"
                    aria-expanded={trustModal === "shipping"}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gl-raised)] text-[var(--gl-accent-text)] transition group-hover:bg-[var(--gl-hover)]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                        <path d="M15 18H9" />
                        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                        <circle cx="17" cy="18" r="2" />
                        <circle cx="7" cy="18" r="2" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      {t("product.freeShip")}
                    </span>
                  </button>
                </li>
                <li className="flex min-w-0">
                  <button
                    type="button"
                    onClick={() => setTrustModal("returns")}
                    className="group flex h-full min-h-[3.25rem] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2.5 text-left text-[11px] font-medium leading-snug text-slate-800 dark:text-slate-200 transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-accent-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                    aria-haspopup="dialog"
                    aria-expanded={trustModal === "returns"}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gl-raised)] text-[var(--gl-accent-text)] transition group-hover:bg-[var(--gl-hover)]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      {t("product.returns")}
                    </span>
                  </button>
                </li>
                <li className="flex min-w-0 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setTrustModal("checkout")}
                    className="group flex h-full min-h-[3.25rem] w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2.5 text-left text-[11px] font-medium leading-snug text-slate-800 dark:text-slate-200 transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-accent-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                    aria-haspopup="dialog"
                    aria-expanded={trustModal === "checkout"}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gl-raised)] text-[var(--gl-accent-text)] transition group-hover:bg-[var(--gl-hover)]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">{t("product.secure")}</span>
                  </button>
                </li>
              </ul>

              <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <button
                  type="button"
                  onClick={addToCart}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] px-6 text-sm font-bold text-[#042210] shadow-lg shadow-[#22c55e]/25 transition hover:from-[#33d06b] hover:to-[#22c55e] hover:shadow-[#22c55e]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gl-surface)]"
                >
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
                    <path d="M16 10a4 4 0 0 1-8 0" />
                    <path d="M3.103 6.034h17.794" />
                    <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                  </svg>
                  {t("product.addToCart")}
                </button>
                <WishlistToggleButton
                  itemId={product.id}
                  itemName={product.name}
                  creativeOnLike
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-[var(--gl-border-soft)] bg-[var(--gl-chip)] px-6 text-slate-900 dark:text-slate-100 transition hover:border-[#22c55e]/50 hover:bg-[var(--gl-hover)] hover:text-[var(--gl-accent-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/40"
                >
                  {t("product.saveWishlist")}
                </WishlistToggleButton>
              </div>
            </div>
          </div>
        </div>
      </main>

      {trustModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label={t("product.modalClose")}
            onClick={() => setTrustModal(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              trustModal === "shipping"
                ? "trust-modal-title-shipping"
                : trustModal === "returns"
                  ? "trust-modal-title-returns"
                  : "trust-modal-title-checkout"
            }
            className="relative z-[1] flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/60"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--gl-border-muted)] bg-[var(--gl-surface-95)] px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gl-accent-text)]">
                  {trustModal === "shipping"
                    ? t("product.trustShippingPill")
                    : trustModal === "returns"
                      ? t("product.trustReturnsPill")
                      : t("product.trustCheckoutPill")}
                </p>
                <h2
                  id={
                    trustModal === "shipping"
                      ? "trust-modal-title-shipping"
                      : trustModal === "returns"
                        ? "trust-modal-title-returns"
                        : "trust-modal-title-checkout"
                  }
                  className="mt-1 text-lg font-semibold text-[var(--gl-heading)]"
                >
                  {trustModal === "shipping"
                    ? t("product.trustShippingTitle")
                    : trustModal === "returns"
                      ? t("product.trustReturnsTitle")
                      : t("product.trustCheckoutTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTrustModal(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--gl-border)] text-slate-700 dark:text-slate-300 transition hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
                aria-label={t("product.modalClose")}
              >
                ✕
              </button>
            </div>
            <div className="min-h-[min(52vh,420px)] flex-1 overflow-y-auto">
              <div className="space-y-4 px-5 py-5 leading-relaxed">
                <div className="rounded-xl border border-[var(--gl-border-soft)] bg-gradient-to-r from-[#22c55e]/10 via-transparent to-[#d7a422]/10 px-4 py-3 shadow-sm">
                  <div className="space-y-3">
                    {trustModalParagraphs.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                      >
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#22c55e]/15 text-[#22c55e] text-[10px] font-bold">
                          ✦
                        </span>
                        <span className="whitespace-pre-line">{paragraph}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showProjectInfoModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label={t("product.modalClose")}
            onClick={() => setShowProjectInfoModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-info-modal-title"
            className="relative z-[1] flex max-h-[min(78vh,520px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/60"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--gl-border-muted)] bg-[var(--gl-surface-95)] px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gl-accent-text)]">
                  {t("product.askChatgpt")}
                </p>
                <h2
                  id="project-info-modal-title"
                  className="mt-1 text-lg font-semibold text-[var(--gl-heading)]"
                >
                  {t("product.aboutProject")}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {projectInfoLoading && !projectInfoAnswer
                    ? t("product.loading")
                    : projectInfoMeta.provider === "openai"
                      ? `OpenAI ${t("product.askChatgpt")}${
                          projectInfoMeta.model
                            ? ` · ${projectInfoMeta.model}`
                            : ""
                        }`
                      : projectInfoMeta.provider === "gemini"
                        ? t("product.geminiNote")
                        : t("product.referenceOnly")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void fetchProjectInfoOverview(true)}
                  disabled={projectInfoLoading}
                  className="rounded-lg border border-[var(--gl-border)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--gl-accent-text)] transition hover:bg-[var(--gl-hover)] disabled:opacity-40"
                >
                  {t("product.refresh")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectInfoModal(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--gl-border)] text-slate-700 dark:text-slate-300 transition hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
                  aria-label={t("product.modalClose")}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="min-h-[12rem] flex-1 overflow-y-auto px-5 py-4">
              {projectInfoMeta.note === "missing_openai_used_gemini" &&
              projectInfoAnswer ? (
                <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-xs leading-relaxed text-amber-100">
                  {t("product.summaryFrom")}{" "}
                  <span className="font-semibold text-amber-50">
                    {t("product.googleGemini")}
                  </span>{" "}
                  (<code className="text-amber-200">GEMINI_API_KEY</code>).{" "}
                  {t("product.add")}{" "}
                  <code className="text-amber-200">OPENAI_API_KEY</code> to{" "}
                  <code className="text-amber-200">backend/.env</code> for a
                  {" "}{t("product.chatgptResponseInstead")}
                </div>
              ) : null}
              {projectInfoMeta.note === "openai_failed_used_gemini" &&
              projectInfoAnswer ? (
                <div className="mb-4 rounded-xl border border-rose-500/35 bg-rose-950/30 px-4 py-3 text-xs leading-relaxed text-rose-100">
                  {t("product.openAiFailedShowing")}{" "}
                  <span className="font-semibold text-rose-50">Gemini</span>{" "}
                  {t("product.insteadCheck")}{" "}
                  <code className="text-rose-200">OPENAI_MODEL</code>.
                </div>
              ) : null}
              {projectInfoMeta.note === "no_ai_available" && projectInfoAnswer ? (
                <div className="mb-4 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-4 py-3 text-xs leading-relaxed text-slate-700 dark:border-slate-600/50 dark:bg-slate-900/60 dark:text-slate-400">
                  {t("product.staticReferenceConfigure")}{" "}
                  <code className="rounded bg-[var(--gl-card)] px-1.5 py-0.5 text-xs font-mono text-emerald-800 dark:text-emerald-300">OPENAI_API_KEY</code> and/or{" "}
                  <code className="rounded bg-[var(--gl-card)] px-1.5 py-0.5 text-xs font-mono text-emerald-800 dark:text-emerald-300">GEMINI_API_KEY</code>, then
                  {" "}{t("product.restartApi")}
                </div>
              ) : null}
              {projectInfoLoading && !projectInfoAnswer ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex h-9 w-9 animate-spin rounded-full border-2 border-[#22c55e]/30 border-t-[#86efac]" />
                  {t("product.loadingOverview")}
                </div>
              ) : null}
              {projectInfoError ? (
                <p className="text-sm leading-relaxed text-rose-700 dark:text-rose-300">
                  {projectInfoError}
                </p>
              ) : null}
              {projectInfoAnswer ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {projectInfoAnswer}
                </p>
              ) : null}
              {projectInfoLoading && projectInfoAnswer ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
                  {t("product.updating")}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}

function CartPage() {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [items, setItems] = useState<CartItem[]>(() => readCartItems());

  useEffect(() => {
    const syncCart = () => {
      setItems(readCartItems());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) syncCart();
    };
    syncCart();
    window.addEventListener(CART_CHANGED_EVENT, syncCart as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(
        CART_CHANGED_EVENT,
        syncCart as EventListener,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateCartItems = (updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
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

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const tax = useMemo(() => Number((subtotal * 0.0825).toFixed(2)), [subtotal]);
  const total = useMemo(
    () => Number((subtotal + tax).toFixed(2)),
    [subtotal, tax],
  );
  const savings = useMemo(() => {
    return items.reduce((sum, item) => {
      if (
        typeof item.originalPrice !== "number" ||
        item.originalPrice <= item.price
      ) {
        return sum;
      }
      return sum + (item.originalPrice - item.price) * item.quantity;
    }, 0);
  }, [items]);

  const [cartTrustModal, setCartTrustModal] = useState<
    "shipping" | "returns" | "checkout" | null
  >(null);

  useEffect(() => {
    if (!cartTrustModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartTrustModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [cartTrustModal]);

  const cartTrustModalBody =
    cartTrustModal === "shipping"
      ? t("home.trustShipInfo")
      : cartTrustModal === "returns"
        ? t("home.trustReturnsInfo")
        : cartTrustModal === "checkout"
          ? t("home.trustPayInfo")
          : "";
  const cartTrustModalParagraphs = cartTrustModalBody
    ? cartTrustModalBody.split("\n\n").filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <TopNav
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t("search.placeholderNav")}
      />

      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-semibold">{t("cart.title")}</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {t("common.back")}
            </Link>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={clearCartItems}
                className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-700 dark:text-rose-200 hover:border-rose-400 hover:bg-rose-500/15"
              >
                {t("drawer.clearAll")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t("cart.empty")}
                  </p>
                  <Link
                    to="/clubs"
                    className="inline-flex items-center justify-center rounded-xl bg-[#22c55e] px-6 py-2.5 text-sm font-bold text-[#042210] shadow-lg shadow-[#22c55e]/20 transition hover:bg-[#33d06b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#86efac]"
                  >
                    {t("cart.browseClubs")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const lineTotal = item.price * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="relative min-h-[5.25rem] rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface)] p-4 pr-[min(19rem,calc(100%-5rem))] sm:min-h-0 sm:pr-[19rem]"
                      >
                        <Link
                          to={`/product/${encodeURIComponent(item.id)}`}
                          className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition hover:bg-[var(--gl-hover)]/40 focus-visible:ring-2 focus-visible:ring-[#22c55e]/50 -m-1 p-1 sm:m-0 sm:p-0 sm:hover:bg-transparent"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src = "/products/club.jpg";
                              }}
                              className="mb-0 h-16 w-16 shrink-0 rounded-lg border border-[var(--gl-border-strong)] object-cover"
                            />
                          ) : (
                            <ProductImage
                              name={item.name}
                              category="golf cart item"
                              imgClassName="mb-0 h-16 w-16 shrink-0 rounded-lg border border-[var(--gl-border-strong)] object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-500">
                              {item.brand}
                            </p>
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                ${item.price.toFixed(2)}
                              </span>
                              {typeof item.originalPrice === "number" &&
                              item.originalPrice > item.price ? (
                                <span className="text-xs text-slate-500 line-through">
                                  ${item.originalPrice.toFixed(2)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </Link>

                        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 sm:gap-4">
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decrementCartItem(item.id)}
                              disabled={item.quantity <= 1}
                              className="inline-flex h-9 w-10 items-center justify-center rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] text-slate-700 dark:text-slate-200 transition hover:bg-[var(--gl-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={t("cart.decreaseQuantityA11y", {
                                name: item.name,
                              })}
                            >
                              -
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => incrementCartItem(item.id)}
                              className="inline-flex h-9 w-10 items-center justify-center rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] text-slate-700 dark:text-slate-200 transition hover:bg-[var(--gl-hover)]"
                              aria-label={t("cart.increaseQuantityA11y", {
                                name: item.name,
                              })}
                            >
                              +
                            </button>
                          </div>

                          <div className="hidden w-[5.25rem] shrink-0 text-right sm:block">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                              {t("drawer.total")}
                            </p>
                            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              ${lineTotal.toFixed(2)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.id)}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-700 dark:text-rose-200 hover:border-rose-400 hover:bg-rose-500/15"
                            aria-label={`${t("cart.remove")} ${item.name}`}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                {t("cart.orderSummary")}
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("drawer.subtotal")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("drawer.shipping")}
                  </span>
                  <span className="text-sm font-semibold text-[var(--gl-accent-text)]">
                    {t("drawer.free")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t("cart.tax")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--gl-border-muted)] pt-3">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t("drawer.total")}
                  </span>
                  <span className="text-base font-bold tabular-nums text-[#22c55e]">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {savings > 0 ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                    {t("product.youSave", { amount: savings.toFixed(2) })}
                  </div>
                ) : null}
              </div>

              {items.length === 0 ? (
                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-[#042210] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("cart.checkout")}
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-[#042210] transition hover:bg-[#33d06b]"
                >
                  {t("cart.checkout")}
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setCartTrustModal("shipping")}
                  className="flex flex-col gap-1 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-3 text-left transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                  aria-haspopup="dialog"
                  aria-expanded={cartTrustModal === "shipping"}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-10 w-12 items-center justify-center rounded-lg bg-[#22c55e]/10 px-1">
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
                        className="text-[#22c55e]"
                        aria-hidden="true"
                      >
                        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                        <path d="M15 18H9"></path>
                        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                        <circle cx="17" cy="18" r="2"></circle>
                        <circle cx="7" cy="18" r="2"></circle>
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t("home.trustShipTitle")}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("home.trustShipSub")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCartTrustModal("returns")}
                  className="flex flex-col gap-1 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-3 text-left transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                  aria-haspopup="dialog"
                  aria-expanded={cartTrustModal === "returns"}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-10 w-12 items-center justify-center rounded-lg bg-[#22c55e]/10 px-1">
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
                        className="text-[#22c55e]"
                        aria-hidden="true"
                      >
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t("home.trustReturnsTitle")}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("home.trustReturnsSub")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCartTrustModal("checkout")}
                  className="flex flex-col gap-1 rounded-xl border border-[var(--gl-border-soft)] bg-[var(--gl-surface-muted)] p-3 text-left transition hover:border-[#22c55e]/35 hover:bg-[var(--gl-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                  aria-haspopup="dialog"
                  aria-expanded={cartTrustModal === "checkout"}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-10 w-12 items-center justify-center rounded-lg bg-[#22c55e]/10 px-1">
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
                        className="text-[#22c55e]"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                      </svg>
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t("home.trustPayTitle")}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t("home.trustPaySub")}
                  </p>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {cartTrustModal ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label={t("product.modalClose")}
            onClick={() => setCartTrustModal(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              cartTrustModal === "shipping"
                ? "cart-trust-modal-title-shipping"
                : cartTrustModal === "returns"
                  ? "cart-trust-modal-title-returns"
                  : "cart-trust-modal-title-checkout"
            }
            className="relative z-[1] flex max-h-[min(85vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/60"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--gl-border-muted)] bg-[var(--gl-surface-95)] px-5 py-4 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gl-accent-text)]">
                  {cartTrustModal === "shipping"
                    ? t("product.trustShippingPill")
                    : cartTrustModal === "returns"
                      ? t("product.trustReturnsPill")
                      : t("product.trustCheckoutPill")}
                </p>
                <h2
                  id={
                    cartTrustModal === "shipping"
                      ? "cart-trust-modal-title-shipping"
                      : cartTrustModal === "returns"
                        ? "cart-trust-modal-title-returns"
                        : "cart-trust-modal-title-checkout"
                  }
                  className="mt-1 text-lg font-semibold text-[var(--gl-heading)]"
                >
                  {cartTrustModal === "shipping"
                    ? t("product.trustShippingTitle")
                    : cartTrustModal === "returns"
                      ? t("product.trustReturnsTitle")
                      : t("product.trustCheckoutTitle")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCartTrustModal(null)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--gl-border)] text-slate-700 dark:text-slate-300 transition hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:hover:text-slate-100"
                aria-label={t("product.modalClose")}
              >
                ✕
              </button>
            </div>
            <div className="min-h-[min(52vh,420px)] flex-1 overflow-y-auto">
              <div className="space-y-4 px-5 py-5 leading-relaxed">
                <div className="rounded-xl border border-[var(--gl-border-soft)] bg-gradient-to-r from-[#22c55e]/10 via-transparent to-[#d7a422]/10 px-4 py-3 shadow-sm">
                  <div className="space-y-3">
                    {cartTrustModalParagraphs.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                      >
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#22c55e]/15 text-[#22c55e] text-[10px] font-bold">
                          ✦
                        </span>
                        <span className="whitespace-pre-line">{paragraph}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>(() => readCartItems());
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<CheckoutOrderResult | null>(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState({
    contactEmail: "",
    contactPhone: "",
    deliveryName: "",
    deliveryAddressLine1: "",
    deliveryAddressLine2: "",
    deliveryCity: "",
    deliveryRegion: "",
    deliveryPostalCode: "",
    deliveryCountry: "United States",
    shippingMethod: "STANDARD" as "STANDARD" | "EXPRESS",
    paymentMethod: "CARD" as "CARD" | "PAYPAL" | "BANK_TRANSFER",
    cardHolderName: "",
    cardNumberMasked: "",
    cardExpiry: "",
  });

  useEffect(() => {
    const syncCart = () => setItems(readCartItems());
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
    if (!countryMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!countryMenuRef.current) return;
      if (!countryMenuRef.current.contains(event.target as Node)) {
        setCountryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [countryMenuOpen]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );
  const cityOptions = CITY_OPTIONS_BY_COUNTRY[form.deliveryCountry] ?? [];
  const shippingCost = form.shippingMethod === "EXPRESS" ? 14.99 : 0;
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + shippingCost + tax).toFixed(2));

  const updateField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (!cityOptions.length) return;
    if (form.deliveryCity && !cityOptions.includes(form.deliveryCity)) {
      updateField("deliveryCity", "");
    }
  }, [cityOptions, form.deliveryCity]);

  const validate = (): string | null => {
    if (!items.length) return t("checkout.errors.cartEmpty");
    if (!isValidEmail(form.contactEmail))
      return t("checkout.errors.emailInvalid");
    if (!form.contactPhone.trim()) return t("checkout.errors.phoneRequired");
    if (!form.deliveryName.trim()) return t("checkout.errors.fullNameRequired");
    if (!form.deliveryAddressLine1.trim())
      return t("checkout.errors.addressLine1Required");
    if (!form.deliveryCity.trim()) return t("checkout.errors.cityRequired");
    if (!form.deliveryRegion.trim())
      return t("checkout.errors.regionRequired");
    if (!form.deliveryPostalCode.trim())
      return t("checkout.errors.postalCodeRequired");
    if (!form.deliveryCountry.trim())
      return t("checkout.errors.countryRequired");
    if (form.paymentMethod === "CARD") {
      const digits = form.cardNumberMasked.replace(/\D/g, "");
      if (!form.cardHolderName.trim())
        return t("checkout.errors.cardHolderRequired");
      if (digits.length < 12) return t("checkout.errors.cardNumberInvalid");
      if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry))
        return t("checkout.errors.cardExpiryFormat");
    }
    return null;
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setPlacing(true);

    const safeCardNumber =
      form.paymentMethod === "CARD"
        ? `**** **** **** ${form.cardNumberMasked.replace(/\D/g, "").slice(-4)}`
        : "N/A";

    const result = await placeOrder({
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      deliveryName: form.deliveryName.trim(),
      deliveryAddressLine1: form.deliveryAddressLine1.trim(),
      deliveryAddressLine2: form.deliveryAddressLine2.trim() || undefined,
      deliveryCity: form.deliveryCity.trim(),
      deliveryRegion: form.deliveryRegion.trim(),
      deliveryPostalCode: form.deliveryPostalCode.trim(),
      deliveryCountry: form.deliveryCountry.trim(),
      shippingMethod: form.shippingMethod,
      paymentMethod: form.paymentMethod,
      cardHolderName: form.cardHolderName.trim() || "N/A",
      cardNumberMasked: safeCardNumber,
      cardExpiry: form.cardExpiry.trim() || "N/A",
      items: items.map((item) => ({
        id: item.id,
        brand: item.brand,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
    });

    setPlacing(false);
    if (result.error || !result.data) {
      setError(result.error ?? t("checkout.errors.orderPlaceFailed"));
      return;
    }

    setOrder(result.data);
    persistCartItems([]);
    notifyCartChanged();
  };

  if (order) {
    return (
      <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-[#22c55e]/40 bg-[var(--gl-surface)] p-7 shadow-xl shadow-[#22c55e]/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gl-accent-text)]">
                {t("checkout.confirmed.pill")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--gl-heading)]">
                {t("checkout.confirmed.title")}
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {t("checkout.confirmed.orderPlacedPrefix")}{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {order.orderNumber}
                </span>{" "}
                {t("checkout.confirmed.orderPlacedSuffix")}
                <br />
                {t("checkout.confirmed.confirmationSentPrefix")}{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {order.contactEmail}
                </span>
                {t("checkout.confirmed.confirmationSentSuffix")}
            </p>
            <div className="mt-5 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-4">
              <div className="flex justify-between text-sm">
                  <span>{t("drawer.subtotal")}</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                  <span>{t("drawer.shipping")}</span>
                <span>${order.shippingCost.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                  <span>{t("cart.tax")}</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-semibold">
                  <span>{t("drawer.total")}</span>
                <span className="text-[#22c55e]">${order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-[#042210] hover:bg-[#33d06b]"
              >
                  {t("checkout.confirmed.continueShopping")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/my-page")}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--gl-border)] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-[var(--gl-hover)]"
              >
                  {t("checkout.confirmed.goToMyPage")}
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gl-page)] text-slate-950 dark:text-slate-50">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gl-accent-text)]">
                {t("drawer.checkout")}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-[var(--gl-heading)]">
                {t("checkout.pageTitle")}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="rounded-lg border border-[var(--gl-border)] px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-[var(--gl-hover)]"
          >
              {t("checkout.backToCart")}
          </button>
        </div>

        <form
          onSubmit={submitOrder}
          className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <section className="space-y-5">
            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("checkout.contactTitle")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={form.contactEmail}
                  onChange={(event) => updateField("contactEmail", event.target.value)}
                  placeholder={t("auth.email")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                />
                <input
                  value={form.contactPhone}
                  onChange={(event) => updateField("contactPhone", event.target.value)}
                  placeholder={t("auth.phone")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
              <h2 className="text-lg font-semibold">
                {t("checkout.deliveryAddressTitle")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={form.deliveryName}
                  onChange={(event) => updateField("deliveryName", event.target.value)}
                  placeholder={t("checkout.fullNamePlaceholder")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={form.deliveryAddressLine1}
                  onChange={(event) =>
                    updateField("deliveryAddressLine1", event.target.value)
                  }
                  placeholder={t("myPage.addressLine1Placeholder")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={form.deliveryAddressLine2}
                  onChange={(event) =>
                    updateField("deliveryAddressLine2", event.target.value)
                  }
                  placeholder={t("myPage.addressLine2OptionalPlaceholder")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm sm:col-span-2"
                />
                {cityOptions.length ? (
                  <select
                    value={form.deliveryCity}
                    onChange={(event) => updateField("deliveryCity", event.target.value)}
                    className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="">{t("myPage.cityPlaceholder")}</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.deliveryCity}
                    onChange={(event) => updateField("deliveryCity", event.target.value)}
                    placeholder={t("myPage.cityPlaceholder")}
                    className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                  />
                )}
                <input
                  value={form.deliveryRegion}
                  onChange={(event) => updateField("deliveryRegion", event.target.value)}
                  placeholder={t("myPage.regionStatePlaceholder")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                />
                <input
                  value={form.deliveryPostalCode}
                  onChange={(event) =>
                    updateField("deliveryPostalCode", event.target.value)
                  }
                  placeholder={t("myPage.postalCodePlaceholder")}
                  className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                />
                <div className="relative" ref={countryMenuRef}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-left text-sm text-slate-900 dark:text-slate-100"
                    onClick={() => setCountryMenuOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={countryMenuOpen}
                  >
                    <span>{form.deliveryCountry}</span>
                    <span className="text-xs text-slate-500">{countryMenuOpen ? "▲" : "▼"}</span>
                  </button>
                  {countryMenuOpen ? (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] p-1 shadow-xl">
                      {COUNTRY_OPTIONS.map((country) => (
                        <button
                          key={country}
                          type="button"
                          className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            form.deliveryCountry === country
                              ? "bg-[#22c55e]/15 text-[#1f8a4a]"
                              : "text-slate-800 hover:bg-[var(--gl-hover)] dark:text-slate-200"
                          }`}
                          role="option"
                          aria-selected={form.deliveryCountry === country}
                          onClick={() => {
                            updateField("deliveryCountry", country);
                            setCountryMenuOpen(false);
                          }}
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("checkout.shippingMethodTitle")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateField("shippingMethod", "STANDARD")}
                  className={`rounded-xl border px-4 py-3 text-left ${
                    form.shippingMethod === "STANDARD"
                      ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                      : "border-[var(--gl-border)] bg-[var(--gl-surface-muted)]"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {t("checkout.shipping.standard.title")}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {t("checkout.shipping.standard.detail")}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => updateField("shippingMethod", "EXPRESS")}
                  className={`rounded-xl border px-4 py-3 text-left ${
                    form.shippingMethod === "EXPRESS"
                      ? "border-[#22c55e]/60 bg-[#22c55e]/10"
                      : "border-[var(--gl-border)] bg-[var(--gl-surface-muted)]"
                  }`}
                >
                  <p className="text-sm font-semibold">
                    {t("checkout.shipping.express.title")}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {t("checkout.shipping.express.detail", {
                      price: "14.99",
                    })}
                  </p>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("checkout.paymentTitle")}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["CARD", "PAYPAL", "BANK_TRANSFER"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateField("paymentMethod", method)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                      form.paymentMethod === method
                        ? "border-[#22c55e]/60 bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-[var(--gl-border)] bg-[var(--gl-surface-muted)]"
                    }`}
                  >
                    {method === "CARD"
                      ? t("checkout.payment.card")
                      : method === "PAYPAL"
                        ? t("checkout.payment.paypal")
                        : t("checkout.payment.bankTransfer")}
                  </button>
                ))}
              </div>
              {form.paymentMethod === "CARD" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.cardHolderName}
                    onChange={(event) =>
                      updateField("cardHolderName", event.target.value)
                    }
                    placeholder={t("checkout.cardHolderNamePlaceholder")}
                    className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm sm:col-span-2"
                  />
                  <input
                    value={form.cardNumberMasked}
                    onChange={(event) =>
                      updateField("cardNumberMasked", event.target.value)
                    }
                    placeholder={t("myPage.cardNumberPlaceholder")}
                    className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm sm:col-span-2"
                  />
                  <input
                    value={form.cardExpiry}
                    onChange={(event) => updateField("cardExpiry", event.target.value)}
                    placeholder={t("myPage.expiryPlaceholder")}
                    className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-sm"
                  />
                </div>
              ) : (
                <p className="mt-4 rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                  {t("checkout.payment.selectedMessage", {
                    method:
                      form.paymentMethod === "PAYPAL"
                        ? t("checkout.payment.paypal")
                        : t("checkout.payment.bankTransfer"),
                  })}
                </p>
              )}
            </div>
          </section>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-5">
              <h2 className="text-lg font-semibold">{t("cart.orderSummary")}</h2>
              <div className="mt-4 space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t("cart.empty")}
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] p-3"
                    >
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.brand}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>
                          {t("cart.qty")} {item.quantity}
                        </span>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-[var(--gl-border)] pt-4 text-sm">
                <div className="flex justify-between">
                  <span>{t("drawer.subtotal")}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>{t("drawer.shipping")}</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>{t("cart.tax")}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex justify-between text-lg font-semibold">
                  <span>{t("drawer.total")}</span>
                  <span className="text-[#22c55e]">${total.toFixed(2)}</span>
                </div>
              </div>

              {error ? (
                <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={placing || items.length === 0}
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 py-2.5 text-sm font-semibold text-[#042210] transition hover:bg-[#33d06b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {placing ? t("checkout.placingOrder") : t("checkout.placeOrder")}
              </button>
            </div>
          </aside>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function CartFlyOverlay() {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
      arc: number;
    }>
  >([]);
  const [toast, setToast] = useState<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const onFly = (ev: Event) => {
      const ce = ev as CustomEvent<CartFlyOrigin>;
      const from = ce.detail;
      if (!from) return;

      const target = document.querySelector(
        "[data-cart-fly-target]",
      ) as HTMLElement | null;
      let toX = window.innerWidth - 52;
      let toY = 40;
      if (target) {
        const r = target.getBoundingClientRect();
        toX = r.left + r.width / 2;
        toY = r.top + r.height / 2;
      }

      const dx = toX - from.clientX;
      const dy = toY - from.clientY;
      const dist = Math.hypot(dx, dy) || 1;
      const arc = -Math.min(36, 0.065 * dist);

      const bumpCart = () => {
        if (!target) return;
        target.classList.add(
          "ring-2",
          "ring-[#22c55e]/90",
          "ring-offset-2",
          "ring-offset-[var(--gl-page)]",
        );
        window.setTimeout(() => {
          target.classList.remove(
            "ring-2",
            "ring-[#22c55e]/90",
            "ring-offset-2",
            "ring-offset-[var(--gl-page)]",
          );
        }, 450);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setToast("Added to cart");
        window.setTimeout(() => setToast(null), 1700);
        bumpCart();
        return;
      }

      const id = ++idRef.current;
      setParticles((prev) => [
        ...prev,
        { id, x: from.clientX, y: from.clientY, dx, dy, arc },
      ]);
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
        bumpCart();
      }, 560);
    };

    window.addEventListener(CART_FLY_EVENT, onFly as EventListener);
    return () =>
      window.removeEventListener(CART_FLY_EVENT, onFly as EventListener);
  }, []);

  return createPortal(
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="cart-fly-particle pointer-events-none fixed z-[300]"
          style={
            {
              left: p.x,
              top: p.y,
              "--cart-dx": `${p.dx}px`,
              "--cart-dy": `${p.dy}px`,
              "--cart-arc": `${p.arc}px`,
            } as React.CSSProperties
          }
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#bbf7d0]/90 bg-gradient-to-br from-[#4ade80] via-[#22c55e] to-[#166534] shadow-[0_8px_28px_rgba(34,197,94,0.55)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#042210"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-95"
              aria-hidden="true"
            >
              <path d="M16 10a4 4 0 0 1-8 0" />
              <path d="M3.103 6.034h17.794" />
              <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
            </svg>
            <span
              className="cart-fly-spark-dot pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#fef9c3] shadow-sm"
              style={{ animationDelay: "0.04s" }}
            />
            <span
              className="cart-fly-spark-dot pointer-events-none absolute -left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/90"
              style={{ animationDelay: "0.1s" }}
            />
          </div>
        </div>
      ))}
      {toast ? (
        <div
          className="pointer-events-none fixed bottom-28 left-1/2 z-[301] -translate-x-1/2 rounded-full border border-[#22c55e]/45 bg-[#052e16]/95 px-5 py-2.5 text-sm font-semibold text-[#d1fae5] shadow-2xl shadow-black/40 backdrop-blur-md"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </>,
    document.body,
  );
}

function RouteActionBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const addToCartFromButton = (button: HTMLElement) => {
      const candidate = extractCartItemFromButton(button);
      if (!candidate) return;
      addItemToCart(candidate, centerOfElement(button));
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const label =
        button.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

      if (label === "add to cart") {
        addToCartFromButton(button);
        event.preventDefault();
        return;
      }

      if (label === "checkout") {
        event.preventDefault();
        navigate("/checkout");
        return;
      }

      if (
        label === "view cart" ||
        label === "add all to cart"
      ) {
        event.preventDefault();
        navigate("/cart");
        return;
      }
    };

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [navigate]);

  return null;
}

function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(() => readUnreadChatCount());
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const isOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const roomId = "global";
  const token = readStoredToken();
  const identity = useMemo(() => getChatIdentityFromToken(token), [token]);
  const visibleMessages = useMemo(
    () => messages.filter((message) => !hiddenMessageIds.includes(message.id)),
    [messages, hiddenMessageIds],
  );

  useEffect(() => {
    setHiddenMessageIds(readHiddenChatMessageIds(identity.userId));
  }, [identity.userId]);

  useEffect(() => {
    persistHiddenChatMessageIds(identity.userId, hiddenMessageIds);
  }, [hiddenMessageIds, identity.userId]);

  useEffect(() => {
    const socket = io(CHAT_WS_ENDPOINT, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("chat:join", {
        roomId,
        userId: identity.userId,
        userName: identity.userName,
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("chat:history", (history: ChatMessage[]) => {
      setMessages(Array.isArray(history) ? history : []);
    });

    socket.on("chat:presence", (payload: { onlineCount?: number }) => {
      setOnlineCount(Math.max(0, Number(payload?.onlineCount ?? 0)));
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((current) => [...current, message].slice(-100));
      if (!isOpenRef.current && message.userId !== identity.userId) {
        setUnreadCount((count) => {
          const next = count + 1;
          persistUnreadChatCount(next);
          return next;
        });
      }
    });

    socket.on(
      "chat:deleted",
      (payload: { messageId?: string; mode?: "me" | "all" }) => {
        const messageId = payload?.messageId?.trim();
        if (!messageId) return;
        if (payload.mode === "all") {
          setMessages((current) =>
            current.filter((message) => message.id !== messageId),
          );
          return;
        }
        setHiddenMessageIds((current) =>
          current.includes(messageId) ? current : [...current, messageId],
        );
      },
    );

    return () => {
      socket.emit("chat:leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [identity.userId, identity.userName]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) return;
    setUnreadCount(0);
    persistUnreadChatCount(0);
  }, [isOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit("chat:send", {
      roomId,
      userId: identity.userId,
      userName: identity.userName,
      text,
    });
    setDraft("");
  };

  const deleteMessageForMe = (messageId: string) => {
    socketRef.current?.emit("chat:delete", {
      roomId,
      messageId,
      mode: "me",
      userId: identity.userId,
    });
    setDeleteMenuId(null);
  };

  const deleteMessageForAll = (messageId: string) => {
    socketRef.current?.emit("chat:delete", {
      roomId,
      messageId,
      mode: "all",
      userId: identity.userId,
    });
    setDeleteMenuId(null);
  };

  const hasOnlineSupport = connected && onlineCount > 0;

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-28 right-4 z-[70] w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/15 dark:border-[#5a3b0d] dark:bg-[#130b03] dark:shadow-black/50 sm:right-6">
          <div className="flex items-center justify-between border-b border-[var(--gl-border-muted)] px-4 py-3 dark:border-[#4a2f09]">
            <div>
              <p className="text-sm font-semibold text-[var(--gl-heading)] dark:text-slate-100">
                {t("chat.title")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {connected
                  ? t("chat.online", { count: onlineCount })
                  : t("chat.connecting")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#2b1a05] dark:hover:text-white"
              aria-label={t("a11y.closeChat")}
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[18rem] space-y-2 overflow-y-auto bg-[var(--gl-surface-muted)]/60 px-4 py-3 dark:bg-transparent"
          >
            {visibleMessages.length === 0 ? (
              <p className="rounded-lg border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-xs text-slate-600 dark:border-[#5a3b0d] dark:bg-[#1c1205] dark:text-slate-400">
                {t("chat.emptyPrompt")}
              </p>
            ) : (
              visibleMessages.map((message) => {
                const isMine = message.userId === identity.userId;
                const isSystem = message.userId === "system";
                const canDelete = isMine && !isSystem;
                return (
                  <div
                    key={message.id}
                    className={
                      canDelete ? "group relative ml-auto max-w-[85%]" : ""
                    }
                  >
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteMenuId((current) =>
                            current === message.id ? null : message.id,
                          )
                        }
                        className={`absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md border border-amber-800/35 bg-white/95 text-amber-900 transition-all duration-200 hover:bg-amber-50 hover:text-rose-700 dark:border-[#5a3b0d]/70 dark:bg-[#2a1a06]/80 dark:text-amber-100 dark:hover:bg-[#3b2408] dark:hover:text-rose-300 ${
                          deleteMenuId === message.id
                            ? "translate-x-0 opacity-100"
                            : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
                        }`}
                        aria-label="Delete message options"
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
                    ) : null}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        isSystem
                          ? "mx-auto border border-amber-200/90 bg-amber-50 text-xs text-amber-900 dark:border-[#5a3b0d] dark:bg-[#2a1a06] dark:text-[#f2bf62]"
                          : isMine
                            ? "ml-auto bg-[#f59e0b] pr-11 text-[#3f2100]"
                            : "border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-800 dark:border-[#5a3b0d] dark:bg-[#1c1205] dark:text-slate-100"
                      }`}
                    >
                      {!isMine && !isSystem ? (
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {message.userName}
                        </p>
                      ) : null}
                      <p>{message.text}</p>
                    </div>
                    {deleteMenuId === message.id ? (
                      <div className="absolute -right-1 top-[calc(100%+0.35rem)] z-10 w-32 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] p-1.5 shadow-xl dark:border-[#5a3b0d] dark:bg-[#1a1004]">
                        <button
                          type="button"
                          onClick={() => deleteMessageForMe(message.id)}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-[var(--gl-hover)] dark:text-slate-400 dark:hover:bg-[#2a1a06]"
                        >
                          {t("chat.deleteForMe")}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMessageForAll(message.id)}
                          className="mt-1 block w-full rounded-md px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-[#2a1017]"
                        >
                          {t("chat.deleteForAll")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-[var(--gl-border-muted)] p-3 dark:border-[#4a2f09]">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface-muted)] px-2 py-2 dark:border-[#5a3b0d] dark:bg-[#1a1004]">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t("chat.placeholder")}
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#f59e0b] px-3 text-xs font-semibold text-[#3f2100] hover:bg-[#fbbf24]"
              >
                {t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-6 right-4 z-[70] flex flex-col items-center gap-1 sm:right-6">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f59e0b] text-[#3f2100] shadow-xl shadow-[#f59e0b]/35 transition-transform hover:scale-105 hover:bg-[#fbbf24] ${
            hasOnlineSupport
              ? "ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-[var(--gl-page)]"
              : ""
          }`}
          aria-label={t("a11y.openChat")}
        >
          {hasOnlineSupport ? (
            <>
              <span className="absolute -left-1 -top-1 inline-flex h-4 w-4 rounded-full bg-emerald-400/80 animate-ping" />
              <span className="absolute -left-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)]" />
            </>
          ) : null}
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
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
        <span className="pointer-events-none select-none text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {t("chat.label")}
        </span>
      </div>
    </>
  );
}

function AiAssistantWidget() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AiPanelMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    t("ai.suggest1"),
    t("ai.suggest2"),
    t("ai.suggest3"),
    t("ai.suggest4"),
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const token = readStoredToken();
  const identity = useMemo(() => getChatIdentityFromToken(token), [token]);

  useEffect(() => {
    const stored = readAiHistory(identity.userId);
    if (stored.length) {
      setMessages(stored);
      return;
    }
    const welcome: AiPanelMessage = {
      id: `ai-welcome-${Date.now()}`,
      role: "assistant",
      text: t("ai.welcome"),
      createdAt: new Date().toISOString(),
    };
    setMessages([welcome]);
  }, [identity.userId]);

  useEffect(() => {
    if (!messages.length) return;
    persistAiHistory(identity.userId, messages);
  }, [messages, identity.userId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen, isThinking]);

  const askAi = async (question: string) => {
    const text = question.trim();
    if (!text || isThinking) return;

    const userMessage: AiPanelMessage = {
      id: `ai-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    const historyPayload = [...messages.slice(-8), userMessage].map((item) => ({
      role: item.role,
      text: item.text,
    }));
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          language: normalizeLang(i18n.language),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed (${response.status})`);
      }

      const payload = (await response.json()) as {
        answer?: string;
        suggestions?: string[];
      };
      const answer =
        payload.answer?.trim() ||
        t("ai.failAnswer");
      const aiMessage: AiPanelMessage = {
        id: `ai-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: answer,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, aiMessage]);
      if (Array.isArray(payload.suggestions) && payload.suggestions.length) {
        setSuggestions(payload.suggestions.slice(0, 4));
      }
    } catch {
      const failMessage: AiPanelMessage = {
        id: `ai-error-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        text: t("ai.unavailable"),
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, failMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const askAiRef = useRef(askAi);
  askAiRef.current = askAi;

  useEffect(() => {
    const onOpen = (event: Event) => {
      const custom = event as CustomEvent<GreenlinksAiOpenDetail>;
      const { message, autoSend } = custom.detail ?? {};
      setIsOpen(true);
      const q = message?.trim();
      if (!q) return;
      if (autoSend) {
        queueMicrotask(() => {
          void askAiRef.current(q);
        });
      } else {
        setDraft(q);
      }
    };
    window.addEventListener(GREENLINKS_AI_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(GREENLINKS_AI_OPEN_EVENT, onOpen);
  }, []);

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-28 left-4 z-[70] w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-[var(--gl-border-card)] bg-[var(--gl-surface)] shadow-2xl shadow-black/15 dark:border-[#224b86] dark:bg-[#071126] dark:shadow-black/50 sm:left-6">
          <div className="flex items-center justify-between border-b border-[var(--gl-border-muted)] px-4 py-3 dark:border-[#1b355f]">
            <div>
              <p className="text-sm font-semibold text-[var(--gl-heading)] dark:text-slate-100">
                {t("product.aiTitle")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("product.aiSub")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-[var(--gl-hover)] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#112241] dark:hover:text-white"
              aria-label={t("a11y.closeAi")}
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            className="max-h-[26rem] min-h-[18rem] space-y-2 overflow-y-auto bg-[var(--gl-surface-muted)]/60 px-4 py-3 dark:bg-transparent"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "border border-[var(--gl-border)] bg-[var(--gl-surface)] text-slate-800 dark:bg-[#0b1a35] dark:text-slate-100"
                    : "ml-auto bg-[#4f9cff] text-[#04142b]"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}
            {isThinking ? (
              <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] px-3 py-2 text-xs text-slate-600 dark:bg-[#0b1a35] dark:text-slate-400">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-[#2563eb] dark:bg-[#61a8ff]" />
                {t("product.aiThinking")}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--gl-border-muted)] p-3 dark:border-[#1b355f]">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    void askAi(suggestion);
                  }}
                  className="rounded-md border border-[var(--gl-border)] bg-[var(--gl-chip)] px-2 py-1 text-[10px] font-medium text-[var(--gl-accent-text)] transition-colors hover:bg-[var(--gl-hover)] dark:bg-[#0b1a35] dark:text-[#9ec7ff] dark:hover:bg-[#102448]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--gl-border)] bg-[var(--gl-surface)] px-2 py-2 dark:bg-[#0b1a35]">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void askAi(draft);
                  }
                }}
                placeholder={t("product.placeholderAsk")}
                className="h-8 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => {
                  void askAi(draft);
                }}
                disabled={isThinking}
                className="inline-flex h-8 items-center justify-center rounded-md bg-[#4f9cff] px-3 text-xs font-semibold text-[#04142b] hover:bg-[#61a8ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("product.ask")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed bottom-6 left-4 z-[70] flex flex-col items-center gap-1 sm:left-6">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#06b6d4] text-white shadow-[0_12px_40px_-8px_rgba(124,58,237,0.65),0_0_0_1px_rgba(255,255,255,0.12)_inset] transition-all duration-300 hover:scale-105 hover:shadow-[0_16px_48px_-8px_rgba(99,102,241,0.75),0_0_32px_-4px_rgba(6,182,212,0.45)]"
          aria-label={t("a11y.openAi")}
        >
          {/* Soft glow ring — reads as “smart / active” */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(196,181,253,0.5), transparent 55%), radial-gradient(circle at 70% 70%, rgba(103,232,249,0.35), transparent 50%)",
            }}
          />
          <span className="pointer-events-none absolute inset-[3px] rounded-full bg-[#0f172a]/25 ring-1 ring-white/25" />
          {/* Sparkles icon — common “AI magic” visual language */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-[1] h-[1.65rem] w-[1.65rem] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            aria-hidden="true"
          >
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
            <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z" />
            <path d="M16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" />
          </svg>
        </button>
        <span className="pointer-events-none select-none text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-800 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] dark:text-white dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {t("ai.label")}
        </span>
      </div>
    </>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = readStoredToken();

    if (!token) {
      navigate("/auth");
      return;
    }

    (async () => {
      const profileResult = await fetchMyPage(token);
      if (!active) return;

      if (profileResult.error || !profileResult.data) {
        setError(profileResult.error ?? "Unable to verify your account");
        setLoading(false);
        return;
      }

      if (profileResult.data.user.role !== "ADMIN") {
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      const usersResult = await fetchAdminUsers(token);
      if (!active) return;
      if (usersResult.error) {
        setError(usersResult.error);
      } else {
        setUsers(usersResult.data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  const onRoleChange = async (userId: string, role: UserRole) => {
    const token = readStoredToken();
    if (!token) {
      navigate("/auth");
      return;
    }

    setSavingUserId(userId);
    setError("");
    const result = await adminUpdateUserRole(token, userId, role);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to update role");
      setSavingUserId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((item) => (item.id === userId ? { ...item, role } : item)),
    );
    setSavingUserId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-6xl">Loading admin dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage user access roles for this store.
          </p>
          <div className="mt-4">
            <Link
              to="/admin/products"
              className="inline-flex rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300"
            >
              Manage Products
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-xl font-semibold">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-slate-200">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.phone || "-"}</td>
                    <td className="px-4 py-3">
                      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                        "-"}
                    </td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            savingUserId === user.id || user.role === "CUSTOMER"
                          }
                          onClick={() => onRoleChange(user.id, "CUSTOMER")}
                          className="rounded-md border border-slate-700 px-3 py-1 text-xs transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Set Customer
                        </button>
                        <button
                          type="button"
                          disabled={
                            savingUserId === user.id || user.role === "ADMIN"
                          }
                          onClick={() => onRoleChange(user.id, "ADMIN")}
                          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Set Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminProductsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<AdminCatalogProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<
    "ALL" | CatalogProductSource
  >("ALL");
  const [form, setForm] = useState<Omit<AdminCatalogProduct, "id">>({
    source: "CLUBS",
    category: "",
    brand: "",
    name: "",
    price: 0,
    originalPrice: null,
    salePrice: null,
    rating: 0,
    reviewCount: 0,
    badge: "",
    imageUrl: "",
    description: "",
    isFeatured: false,
    isActive: true,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      source: "CLUBS",
      category: "",
      brand: "",
      name: "",
      price: 0,
      originalPrice: null,
      salePrice: null,
      rating: 0,
      reviewCount: 0,
      badge: "",
      imageUrl: "",
      description: "",
      isFeatured: false,
      isActive: true,
    });
  };

  useEffect(() => {
    let active = true;
    const token = readStoredToken();

    if (!token) {
      navigate("/auth");
      return;
    }

    (async () => {
      const profileResult = await fetchMyPage(token);
      if (!active) return;
      if (profileResult.error || !profileResult.data) {
        setError(profileResult.error ?? "Unable to verify your account");
        setLoading(false);
        return;
      }
      if (profileResult.data.user.role !== "ADMIN") {
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      const result = await fetchAdminCatalogProducts(token);
      if (!active) return;
      if (result.error) {
        setError(result.error);
      } else {
        setProducts(result.data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  const saveProduct = async () => {
    const token = readStoredToken();
    if (!token) {
      navigate("/auth");
      return;
    }
    setSaving(true);
    setError("");

    const hasValidPrice = Number.isFinite(form.price) && form.price >= 0;
    const hasValidRating = Number.isFinite(form.rating) && form.rating >= 0;
    const hasValidReviewCount =
      Number.isFinite(form.reviewCount) && form.reviewCount >= 0;
    const hasValidOriginalPrice =
      form.originalPrice == null ||
      (Number.isFinite(form.originalPrice) && form.originalPrice >= 0);
    const hasValidSalePrice =
      form.salePrice == null ||
      (Number.isFinite(form.salePrice) && form.salePrice >= 0);

    if (
      !hasValidPrice ||
      !hasValidRating ||
      !hasValidReviewCount ||
      !hasValidOriginalPrice ||
      !hasValidSalePrice
    ) {
      setSaving(false);
      setError("Please enter valid numeric values before saving.");
      return;
    }

    const payload = {
      ...form,
      category: form.category.trim(),
      brand: form.brand.trim(),
      name: form.name.trim(),
      badge: form.badge?.trim() || undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
      description: form.description?.trim() || undefined,
      originalPrice: form.originalPrice ?? undefined,
      salePrice: form.salePrice ?? undefined,
      reviewCount: Math.floor(form.reviewCount),
    };

    if (
      !payload.category ||
      !payload.brand ||
      !payload.name ||
      payload.price < 0
    ) {
      setSaving(false);
      setError("Please fill required fields with valid values.");
      return;
    }

    const result = editingId
      ? await adminUpdateCatalogProduct(token, editingId, payload)
      : await adminCreateCatalogProduct(token, payload);

    if (result.error || !result.data) {
      setError(result.error ?? "Unable to save product");
      setSaving(false);
      return;
    }

    if (editingId) {
      setProducts((prev) =>
        prev.map((item) => (item.id === editingId ? result.data! : item)),
      );
    } else {
      setProducts((prev) => [result.data!, ...prev]);
    }
    resetForm();
    setSaving(false);
  };

  const onEdit = (item: AdminCatalogProduct) => {
    setEditingId(item.id);
    setForm({
      source: item.source,
      category: item.category,
      brand: item.brand,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice ?? null,
      salePrice: item.salePrice ?? null,
      rating: item.rating,
      reviewCount: item.reviewCount,
      badge: item.badge ?? "",
      imageUrl: item.imageUrl ?? "",
      description: item.description ?? "",
      isFeatured: item.isFeatured,
      isActive: item.isActive,
    });
  };

  const onDelete = async (id: string) => {
    const token = readStoredToken();
    if (!token) {
      navigate("/auth");
      return;
    }
    if (!window.confirm("Delete this product?")) return;

    const result = await adminDeleteCatalogProduct(token, id);
    if (result.error || !result.data) {
      setError(result.error ?? "Unable to delete product");
      return;
    }
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const catalogCounts = useMemo(() => {
    const counts: Record<CatalogProductSource, number> = {
      CLUBS: 0,
      BALLS: 0,
      BAGS: 0,
      APPAREL: 0,
      ACCESSORIES: 0,
      SALE: 0,
    };
    for (const item of products) {
      counts[item.source] += 1;
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const base =
      selectedCatalog === "ALL"
        ? products
        : products.filter((item) => item.source === selectedCatalog);
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCatalog]);

  const onImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = readStoredToken();
    if (!token) {
      navigate("/auth");
      return;
    }

    setUploadingImage(true);
    setError("");
    const result = await uploadAdminProductImage(token, file);
    if (result.error || !result.imageUrl) {
      setError(result.error ?? "Unable to upload image");
      setUploadingImage(false);
      event.target.value = "";
      return;
    }

    setForm((prev) => ({ ...prev, imageUrl: result.imageUrl! }));
    setUploadingImage(false);
    event.target.value = "";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-900 dark:text-slate-100">
        <div className="mx-auto max-w-6xl">Loading admin products...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-14 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Admin Products</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Create, edit, and delete catalog products in database.
              </p>
            </div>
            <Link
              to="/admin"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:border-slate-500"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-4 text-xl font-semibold">
            {editingId ? "Edit Product" : "Create Product"}
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <select
              value={form.source}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  source: event.target.value as CatalogProductSource,
                }))
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              {["CLUBS", "BALLS", "BAGS", "APPAREL", "ACCESSORIES", "SALE"].map(
                (source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ),
              )}
            </select>
            <input
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="Category"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={form.brand}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brand: event.target.value }))
              }
              placeholder="Brand"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Product Name"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  price: Number(event.target.value),
                }))
              }
              placeholder="Price"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.originalPrice ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  originalPrice: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
              placeholder="Original Price"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.salePrice ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  salePrice: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
              placeholder="Sale Price"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.rating}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  rating: Number(event.target.value),
                }))
              }
              placeholder="Rating"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              step="1"
              value={form.reviewCount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  reviewCount: Number(event.target.value),
                }))
              }
              placeholder="Review Count"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={form.badge ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, badge: event.target.value }))
              }
              placeholder="Badge"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <div className="space-y-2">
              <label className="block text-xs text-slate-600 dark:text-slate-400">
                Upload product image
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={onImageSelect}
                className="block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:text-slate-300"
              />
              <input
                value={form.imageUrl ?? ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
                }
                placeholder="Uploaded image path appears here"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
              <p className="text-xs text-slate-500">
                {uploadingImage
                  ? "Uploading image..."
                  : form.imageUrl
                    ? `Current image: ${form.imageUrl}`
                    : "No image uploaded yet"}
              </p>
            </div>
            <input
              value={form.description ?? ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm md:col-span-2"
            />
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isFeatured: event.target.checked,
                  }))
                }
              />
              Featured
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveProduct}
              disabled={saving}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Create Product"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                Catalog Products ({filteredProducts.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "ALL",
                    "CLUBS",
                    "BALLS",
                    "BAGS",
                    "APPAREL",
                    "ACCESSORIES",
                    "SALE",
                  ] as const
                ).map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setSelectedCatalog(source)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      selectedCatalog === source
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        : "border-slate-700 text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {source === "ALL"
                      ? `ALL (${products.length})`
                      : `${source} (${catalogCounts[source]})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-800/60 text-slate-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <td className="px-4 py-3 text-slate-300">{index + 1}</td>
                    <td className="px-4 py-3">{item.source}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.brand}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {item.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="rounded-md border border-slate-700 px-3 py-1 text-xs hover:border-slate-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function CompanyShell({ slug }: { slug: CompanyPageSlug }) {
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

function SupportShell({ slug }: { slug: SupportPageSlug }) {
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

function AboutPage() {
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

function AppRoutes() {
  return (
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <AiAssistantWidget />
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;

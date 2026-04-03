import type { TFunction } from "i18next";
import {
  AI_HISTORY_PREFIX,
  CART_CHANGED_EVENT,
  CART_FLY_EVENT,
  CART_KEY,
  CHAT_HIDDEN_PREFIX,
  CHAT_UNREAD_KEY,
  GREENLINKS_AI_OPEN_EVENT,
  NEWSLETTER_KEY,
  TOKEN_KEY,
  WISHLIST_KEY,
} from "../config/app-config";
import type {
  AiPanelMessage,
  CartFlyOrigin,
  CartItem,
  ChatIdentity,
} from "../types/app";

export function centerOfElement(el: HTMLElement): CartFlyOrigin {
  const r = el.getBoundingClientRect();
  return {
    clientX: r.left + r.width / 2,
    clientY: r.top + r.height / 2,
  };
}

export function translatePriceFilterLabel(option: string, t: TFunction): string {
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
export type { GreenlinksAiOpenDetail };

export type NearbyGolfShop = {
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

export function openGreenlinksAiAssistant(
  detail: GreenlinksAiOpenDetail = {},
) {
  window.dispatchEvent(new CustomEvent(GREENLINKS_AI_OPEN_EVENT, { detail }));
}

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function persistToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage errors (private mode / restricted browser settings).
  }
}

export function readUnreadChatCount(): number {
  try {
    const raw = localStorage.getItem(CHAT_UNREAD_KEY);
    const parsed = Number(raw ?? 0);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  } catch {
    return 0;
  }
}

export function persistUnreadChatCount(value: number): void {
  try {
    localStorage.setItem(CHAT_UNREAD_KEY, String(Math.max(0, value)));
  } catch {
    // Ignore storage errors.
  }
}

export function readHiddenChatMessageIds(userId: string): string[] {
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

export function persistHiddenChatMessageIds(userId: string, ids: string[]): void {
  try {
    localStorage.setItem(`${CHAT_HIDDEN_PREFIX}${userId}`, JSON.stringify(ids));
  } catch {
    // Ignore storage errors.
  }
}

export function readAiHistory(userId: string): AiPanelMessage[] {
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

export function persistAiHistory(userId: string, items: AiPanelMessage[]): void {
  try {
    localStorage.setItem(
      `${AI_HISTORY_PREFIX}${userId}`,
      JSON.stringify(items.slice(-40)),
    );
  } catch {
    // Ignore storage errors.
  }
}

export function getChatIdentityFromToken(token: string | null): ChatIdentity {
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

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore storage errors (private mode / restricted browser settings).
  }
}

export function readWishlistIds(): string[] {
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

export function persistWishlistIds(ids: string[]): void {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors.
  }
}

const CATALOG_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCatalogUuid(id: string): boolean {
  return CATALOG_UUID_RE.test(id.trim());
}

export function readCartItems(): CartItem[] {
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

export function persistCartItems(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
}

export function notifyCartChanged(): void {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function makeCartItemId(brand: string, name: string): string {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return `cart-${normalize(brand)}-${normalize(name)}`;
}

export function addItemToCart(
  item: Omit<CartItem, "quantity">,
  flyFrom?: CartFlyOrigin | null,
): void {
  const items = readCartItems();
  const existing = items.find((entry) => entry.id === item.id);
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

export function parsePriceValue(text: string): number | null {
  const numeric = text.replace(/[^0-9.]/g, "");
  if (!numeric) return null;
  const value = Number.parseFloat(numeric);
  return Number.isFinite(value) ? value : null;
}

export function extractProductIdFromContainer(container: Element): string | null {
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

export function extractCartItemFromButton(
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

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function saveNewsletterEmail(email: string): "created" | "exists" {
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

export function getProductImageUrl(
  name: string,
  category = "golf equipment",
): string {
  const text = `${category} ${name}`.toLowerCase();

  if (text.includes("rangefinder")) return "/products/rangefinder.jpg";
  if (text.includes("watch") || text.includes("gps"))
    return "/products/watch.jpg";
  if (text.includes("grip")) return "/products/grip.jpg";
  if (text.includes("tee")) return "/products/tees.jpg";
  if (text.includes("training")) return "/products/training.jpg";
  if (text.includes("divot")) return "/products/divot.jpg";

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

export function formatProductCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    return `${formatted}+`;
  }
  return `${n}+`;
}

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

export function buildOpenStreetMapEmbedUrl(
  latitude: number,
  longitude: number,
) {
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

export function buildGoogleMapsNearbySearchUrl(
  latitude: number,
  longitude: number,
) {
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

export async function fetchNearbyGolfShopsWithRetry(
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

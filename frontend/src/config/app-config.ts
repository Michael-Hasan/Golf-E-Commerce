/**
 * Default to same-origin API paths so the browser can use Vite's dev proxy.
 * Set `VITE_API_URL` in `frontend/.env` to override this when needed.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const REST_API_BASE = `${API_BASE}/v1`;

export const GRAPHQL_ENDPOINT = `${API_BASE}/graphql`;
export const CHAT_WS_ENDPOINT = `${API_BASE}/chat`;
export const AI_CHAT_ENDPOINT = `${REST_API_BASE}/ai-chat/respond`;
export const AI_PROJECT_INFO_ENDPOINT = `${REST_API_BASE}/ai-chat/project-info`;
export const ADMIN_PRODUCT_UPLOAD_ENDPOINT =
  `${REST_API_BASE}/admin/uploads/product-image`;

export const TOKEN_KEY = "golf_auth_token";
export const WISHLIST_KEY = "golf_wishlist_ids";
export const NEWSLETTER_KEY = "golf_newsletter_subscribers";
export const CART_KEY = "golf_cart_items";
export const CART_CHANGED_EVENT = "cart:changed";
export const CART_FLY_EVENT = "cart:fly";
export const CHAT_UNREAD_KEY = "golf_chat_unread";
export const CHAT_HIDDEN_PREFIX = "golf_chat_hidden_";
export const AI_HISTORY_PREFIX = "golf_ai_history_";
export const GREENLINKS_AI_OPEN_EVENT = "greenlinks-open-ai-assistant";

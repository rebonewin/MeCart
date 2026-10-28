/**
 * Shared, runtime-free types for the MECO assistant.
 *
 * These types are safe to import from both client components and server route
 * handlers. Nothing in this module reads secrets or touches the database.
 */

export type AssistantProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image: string | null;
  brandName: string;
  categoryName: string;
  categorySlug: string;
  subCategoryName: string;
  description: string;
  material: string;
  colors: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  bestSeller: boolean;
  newArrival: boolean;
};

export type AssistantCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type AssistantCatalog = {
  products: AssistantProduct[];
  categories: AssistantCategory[];
};

export type AssistantIntent =
  | "greeting"
  | "recommend"
  | "search"
  | "cart"
  | "checkout"
  | "order"
  | "faq"
  | "gift"
  | "contact"
  | "thanks"
  | "smalltalk";

export type AssistantAction = {
  label: string;
  href: string;
};

export type AssistantReply = {
  intent: AssistantIntent;
  text: string;
  products?: AssistantProduct[];
  categories?: AssistantCategory[];
  actions?: AssistantAction[];
  suggestions?: string[];
  orderLookup?: boolean;
  orderNumber?: string;
};

export type AiBrowsingItem = {
  name: string;
  brandName?: string;
  categoryName?: string;
};

export type AiWishlistItem = {
  name: string;
  price: number;
};

/** Read-only order summary loaded on the server for the signed-in shopper. */
export type AiOrderSummary = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  updatedAt: string;
};

export type AssistantContext = {
  name?: string | null;
  cartCount: number;
  cartSubtotal: number;
  cartItems: { name: string; quantity: number; price: number }[];
  wishlistCount: number;
  wishlistItems?: AiWishlistItem[];
  recentlyViewed?: AiBrowsingItem[];
  pathname?: string;
};

/** A single turn sent to /api/ai/chat. */
export type AiChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Client-supplied, non-authoritative shopping context. */
export type AiChatContext = {
  name?: string;
  cartCount: number;
  cartSubtotal: number;
  cartItems: { name: string; quantity: number; price: number }[];
  wishlistCount: number;
  /** Product names only. Used to answer wishlist and gifting questions. */
  wishlistItems?: AiWishlistItem[];
  /** Lightweight browsing memory, not full product records. */
  recentlyViewed?: AiBrowsingItem[];
  pathname?: string;
};

export type AiChatRequest = {
  messages: AiChatHistoryMessage[];
  context?: AiChatContext;
};

export type AiChatErrorCode =
  | "AI_NOT_CONFIGURED"
  | "RATE_LIMITED"
  | "INVALID_REQUEST"
  | "UPSTREAM_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "UNKNOWN";

export type AiChatErrorBody = {
  error: string;
  code: AiChatErrorCode;
  retryAfter?: number;
};

/** Server-sent events emitted by /api/ai/chat. */
export type AiChatStreamEvent =
  | {
      type: "meta";
      suggestions?: string[];
      actions?: AssistantAction[];
      orderLookup?: boolean;
      orderNumber?: string;
    }
  | { type: "delta"; text: string }
  | {
      type: "products";
      products?: AssistantProduct[];
      categories?: AssistantCategory[];
    }
  | { type: "done"; finishReason?: string }
  | {
      type: "error";
      error: string;
      code: AiChatErrorCode;
      retryable: boolean;
    };

/** Response from GET /api/ai/catalog. */
export type AssistantCatalogPayload = AssistantCatalog & {
  aiConfigured: boolean;
  generatedAt: string;
};

export type MecoMessageStatus = "streaming" | "complete" | "error";

/**
 * The UI/storage shape of a conversation message. `guest` is the shopper and
 * `meco` is the assistant. Assistant messages may carry partial text while
 * streaming and an error while retrying.
 */
export type MecoChatMessage = {
  id: string;
  role: "guest" | "meco";
  text?: string;
  reply?: AssistantReply;
  status?: MecoMessageStatus;
  error?: string;
  retryable?: boolean;
  createdAt?: number;
};

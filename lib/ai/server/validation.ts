import "server-only";

import { z } from "zod";
import type { AiChatContext, AiChatHistoryMessage } from "@/lib/ai/types";

export const MAX_BODY_BYTES = 32 * 1024;
export const MAX_MESSAGES = 40;
export const MAX_MESSAGE_CHARS = 4_000;
export const MAX_HISTORY_CHARS = 14_000;
const MAX_SENT_MESSAGES = 20;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_MESSAGE_CHARS),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  // Context is validated separately so a malformed optional field never blocks
  // a legitimate shopping question.
  context: z.unknown().optional(),
});

const contextSchema = z.object({
  name: z.string().max(80).optional(),
  cartCount: z.number().int().min(0).max(999).optional(),
  cartSubtotal: z.number().min(0).max(1_000_000_000).optional(),
  cartItems: z
    .array(
      z.object({
        name: z.string().max(160),
        quantity: z.number().int().min(1).max(99),
        price: z.number().min(0).max(10_000_000),
      }),
    )
    .max(20)
    .optional(),
  wishlistCount: z.number().int().min(0).max(9_999).optional(),
  wishlistItems: z
    .array(
      z.object({
        name: z.string().max(160),
        price: z.number().min(0).max(10_000_000),
      }),
    )
    .max(12)
    .optional(),
  recentlyViewed: z
    .array(
      z.object({
        name: z.string().max(160),
        brandName: z.string().max(120).optional(),
        categoryName: z.string().max(120).optional(),
      }),
    )
    .max(8)
    .optional(),
  pathname: z.string().max(300).optional(),
});

export type PreparedChatRequest = {
  messages: AiChatHistoryMessage[];
  context: AiChatContext;
  latestUserMessage: string;
};

export type ValidationResult =
  | { ok: true; data: PreparedChatRequest }
  | { ok: false; message: string };

function sanitizeText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function normalizeContext(input: unknown): AiChatContext {
  const parsed = contextSchema.safeParse(input);
  if (!parsed.success) {
    return {
      cartCount: 0,
      cartSubtotal: 0,
      cartItems: [],
      wishlistCount: 0,
    };
  }

  const data = parsed.data;
  const cartItems = (data.cartItems ?? [])
    .map((item) => ({
      name: sanitizeText(item.name).trim().slice(0, 160),
      quantity: item.quantity,
      price: item.price,
    }))
    .filter((item) => item.name.length > 0);

  const wishlistItems = (data.wishlistItems ?? [])
    .map((item) => ({
      name: sanitizeText(item.name).trim().slice(0, 160),
      price: item.price,
    }))
    .filter((item) => item.name.length > 0);

  const recentlyViewed = (data.recentlyViewed ?? [])
    .map((item) => ({
      name: sanitizeText(item.name).trim().slice(0, 160),
      brandName: item.brandName
        ? sanitizeText(item.brandName).trim().slice(0, 120)
        : undefined,
      categoryName: item.categoryName
        ? sanitizeText(item.categoryName).trim().slice(0, 120)
        : undefined,
    }))
    .filter((item) => item.name.length > 0);

  return {
    name: data.name ? sanitizeText(data.name).trim().slice(0, 80) : undefined,
    cartCount: data.cartCount ?? cartItems.reduce((sum, item) => sum + item.quantity, 0),
    cartSubtotal: data.cartSubtotal ?? 0,
    cartItems,
    wishlistCount: data.wishlistCount ?? 0,
    wishlistItems: wishlistItems.length ? wishlistItems : undefined,
    recentlyViewed: recentlyViewed.length ? recentlyViewed : undefined,
    pathname:
      data.pathname && data.pathname.startsWith("/")
        ? data.pathname.slice(0, 300)
        : undefined,
  };
}

function trimHistory(messages: AiChatHistoryMessage[]) {
  // A stored greeting is not useful model context; start at the shopper's
  // first real turn.
  const firstUser = messages.findIndex((message) => message.role === "user");
  const relevant = firstUser >= 0 ? messages.slice(firstUser) : messages;
  const recent = relevant.slice(-MAX_SENT_MESSAGES);

  let total = recent.reduce((sum, message) => sum + message.content.length, 0);
  let start = 0;
  while (total > MAX_HISTORY_CHARS && start < recent.length - 1) {
    total -= recent[start].content.length;
    start += 1;
  }

  return recent.slice(start);
}

export function validateChatBody(body: unknown): ValidationResult {
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "That message could not be sent. Please keep it under 4,000 characters and try again.",
    };
  }

  const messages: AiChatHistoryMessage[] = [];
  for (const message of parsed.data.messages) {
    const content = sanitizeText(message.content).trim();
    if (!content) continue;
    messages.push({ role: message.role, content });
  }

  if (!messages.length) {
    return { ok: false, message: "Please write a message before sending." };
  }

  const latest = messages[messages.length - 1];
  if (latest.role !== "user") {
    return {
      ok: false,
      message: "The conversation must end with a shopper message.",
    };
  }

  if (latest.content.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      message: "That message is too long. Please keep it under 4,000 characters.",
    };
  }

  return {
    ok: true,
    data: {
      messages: trimHistory(messages),
      context: normalizeContext(parsed.data.context),
      latestUserMessage: latest.content,
    },
  };
}

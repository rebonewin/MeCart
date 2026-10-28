"use client";

import { isSafeAssistantHref, isSafeProductSlug } from "./safety";
import type {
  AssistantCategory,
  AssistantProduct,
  AssistantReply,
  MecoChatMessage,
} from "./types";

const STORAGE_KEY = "mecart:meco:conversation:v2";
const STORAGE_VERSION = 2;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_MESSAGES = 40;
const MAX_STORED_CHARS = 180_000;
const MAX_TEXT_CHARS = 8_000;

type StoredConversation = {
  version: number;
  savedAt: number;
  messages: MecoChatMessage[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function clampText(value: unknown, max = MAX_TEXT_CHARS) {
  return typeof value === "string" ? value.slice(0, max) : undefined;
}

function isStatus(value: unknown): value is MecoChatMessage["status"] {
  return value === "streaming" || value === "complete" || value === "error";
}

function isIntent(value: unknown): value is AssistantReply["intent"] {
  return (
    value === "greeting" ||
    value === "recommend" ||
    value === "search" ||
    value === "cart" ||
    value === "checkout" ||
    value === "order" ||
    value === "faq" ||
    value === "gift" ||
    value === "contact" ||
    value === "thanks" ||
    value === "smalltalk"
  );
}

function isProduct(value: unknown): value is AssistantProduct {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    isSafeProductSlug(value.slug) &&
    typeof value.price === "number"
  );
}

function isCategory(value: unknown): value is AssistantCategory {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string"
  );
}

function parseReply(value: unknown): AssistantReply | undefined {
  if (!isRecord(value) || !isIntent(value.intent) || typeof value.text !== "string") {
    return undefined;
  }

  return {
    intent: value.intent,
    text: value.text.slice(0, MAX_TEXT_CHARS),
    products: Array.isArray(value.products)
      ? value.products.filter(isProduct).slice(0, 6)
      : undefined,
    categories: Array.isArray(value.categories)
      ? value.categories.filter(isCategory).slice(0, 8)
      : undefined,
    actions: Array.isArray(value.actions)
      ? value.actions
          .filter(
            (action): action is { label: string; href: string } =>
              isRecord(action) &&
              typeof action.label === "string" &&
              typeof action.href === "string" &&
              isSafeAssistantHref(action.href),
          )
          .slice(0, 8)
      : undefined,
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions
          .filter((suggestion): suggestion is string => typeof suggestion === "string")
          .slice(0, 6)
      : undefined,
    orderLookup: value.orderLookup === true,
    orderNumber:
      typeof value.orderNumber === "string"
        ? value.orderNumber.slice(0, 80)
        : undefined,
  };
}

function parseMessage(value: unknown): MecoChatMessage | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length > 100) return null;
  if (value.role !== "guest" && value.role !== "meco") return null;

  const text = clampText(value.text);
  const reply = parseReply(value.reply);
  if (!text?.trim() && !reply?.text.trim()) return null;

  return {
    id: value.id,
    role: value.role,
    text,
    reply,
    status: isStatus(value.status) ? value.status : "complete",
    error: clampText(value.error, 500),
    retryable: value.retryable === true,
    createdAt:
      typeof value.createdAt === "number" && Number.isFinite(value.createdAt)
        ? value.createdAt
        : undefined,
  };
}

export function loadConversation(): MecoChatMessage[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return null;
    if (typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (!Array.isArray(parsed.messages)) return null;

    const messages = parsed.messages
      .map(parseMessage)
      .filter((message): message is MecoChatMessage => Boolean(message))
      .slice(-MAX_MESSAGES);

    return messages.length ? messages : null;
  } catch {
    return null;
  }
}

export function saveConversation(messages: MecoChatMessage[]) {
  if (typeof window === "undefined") return;

  try {
    let clean = messages
      .filter((message) => message.status !== "streaming")
      .filter((message) => Boolean(message.text?.trim() || message.reply?.text.trim()))
      .slice(-MAX_MESSAGES);

    const write = () => {
      const payload: StoredConversation = {
        version: STORAGE_VERSION,
        savedAt: Date.now(),
        messages: clean,
      };
      const serialized = JSON.stringify(payload);
      if (serialized.length > MAX_STORED_CHARS) return false;
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    };

    while (clean.length && !write()) {
      clean = clean.slice(1);
    }

    if (!clean.length) window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be disabled by the browser or full. The conversation still
    // works for the current session.
  }
}

export function clearStoredConversation() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore disabled storage.
  }
}

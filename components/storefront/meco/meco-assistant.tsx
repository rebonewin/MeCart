"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RiderModel } from "@/components/storefront/rider/rider-model";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { useVoiceSearch } from "@/lib/hooks/use-voice-search";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { usePrefersReducedMotion } from "@/lib/motion";
import { fetchAssistantCatalog } from "@/lib/ai/catalog-client";
import {
  isAbortError,
  MecoApiError,
  streamMecoChat,
} from "@/lib/ai/chat-client";
import {
  clearStoredConversation,
  loadConversation,
  saveConversation,
} from "@/lib/ai/chat-storage";
import { answerMeco, mecoInitialReply } from "@/lib/ai/assistant";
import type {
  AiChatHistoryMessage,
  AssistantCatalog,
  AssistantContext,
  AssistantProduct,
  MecoChatMessage,
} from "@/lib/ai/types";
import { cn } from "@/lib/cn";
import { MessageError, ReplyBody } from "./meco-message";
import { MecoOrderLookup } from "./meco-order-lookup";

const MAX_INPUT_CHARS = 4_000;
const MAX_HISTORY_MESSAGES = 20;

let messageSequence = 0;

function nextMessageId() {
  messageSequence += 1;
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `meco-${Date.now().toString(36)}-${messageSequence}`;
}

const messageTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function messageTime(createdAt?: number) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return {
    label: messageTimeFormatter.format(date),
    iso: date.toISOString(),
  };
}

function greetingMessage(
  context: AssistantContext,
  catalog: AssistantCatalog | null,
): MecoChatMessage {
  return {
    id: nextMessageId(),
    role: "meco",
    reply: mecoInitialReply(context, catalog),
    status: "complete",
    createdAt: Date.now(),
  };
}

/**
 * Convert the visible conversation into the compact history sent to the server.
 * Interrupted or failed assistant turns are intentionally left out so a retry
 * does not feed a partial answer back to the model as if it were complete.
 */
function toHistory(messages: MecoChatMessage[]): AiChatHistoryMessage[] {
  const history: AiChatHistoryMessage[] = [];

  for (const message of messages) {
    if (message.role === "guest") {
      const text = message.text?.trim();
      if (text) {
        history.push({
          role: "user",
          content: text.slice(0, MAX_INPUT_CHARS),
        });
      }
      continue;
    }

    if (message.status === "streaming" || message.status === "error") continue;
    const text = message.reply?.text.trim();
    if (text) {
      history.push({
        role: "assistant",
        content: text.slice(0, MAX_INPUT_CHARS),
      });
    }
  }

  return history.slice(-MAX_HISTORY_MESSAGES);
}

function latestSuggestions(messages: MecoChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "meco") continue;
    const next = message.reply?.suggestions;
    if (next?.length) return next.slice(0, 4);
  }
  return [] as string[];
}

export function MecoAssistant() {
  const auth = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const recentlyViewed = useRecentlyViewed();
  const online = useOnlineStatus();
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MecoChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<AssistantCatalog | null>(null);
  const [catalogState, setCatalogState] = useState<
    "idle" | "ready" | "error"
  >("idle");
  const [localMode, setLocalMode] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupOrderNumber, setLookupOrderNumber] = useState<
    string | undefined
  >(undefined);

  const context = useMemo<AssistantContext>(
    () => ({
      name: auth.user?.name ?? undefined,
      cartCount: cart.count,
      cartSubtotal: cart.subtotal,
      cartItems: cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      wishlistCount: wishlist.items.length,
      wishlistItems: wishlist.items.slice(0, 8).map((item) => ({
        name: item.name,
        price: item.price,
      })),
      recentlyViewed: recentlyViewed.items.slice(0, 6).map((item) => ({
        name: item.name,
        brandName: item.brandName || undefined,
        categoryName: item.categoryName || undefined,
      })),
      pathname,
    }),
    [
      auth.user?.name,
      cart.count,
      cart.subtotal,
      cart.items,
      wishlist.items,
      recentlyViewed.items,
      pathname,
    ],
  );

  const savedIds = useMemo(
    () => new Set(wishlist.items.map((item) => item.productId)),
    [wishlist.items],
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeRef = useRef<{
    controller: AbortController;
    assistantId: string;
  } | null>(null);
  const localTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  const stickRef = useRef(true);
  const messagesRef = useRef<MecoChatMessage[]>([]);
  const contextRef = useRef<AssistantContext>(context);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const voice = useVoiceSearch({
    onResult: (transcript) => {
      setInput(transcript.slice(0, MAX_INPUT_CHARS));
      inputRef.current?.focus();
      toast.message("Voice search ready", {
        description: `“${transcript.slice(0, 80)}”`,
      });
    },
  });

  const close = useCallback(() => {
    setOpen(false);
    saveConversation(messagesRef.current);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  const openAssistant = useCallback(() => {
    setOpen(true);
    if (catalogState === "error") setCatalogState("idle");
  }, [catalogState]);

  const patchMessage = useCallback(
    (
      id: string,
      updater: (message: MecoChatMessage) => MecoChatMessage,
    ) => {
      setMessages((current) =>
        current.map((message) => (message.id === id ? updater(message) : message)),
      );
    },
    [],
  );

  const abortActive = useCallback(() => {
    const active = activeRef.current;
    activeRef.current = null;
    active?.controller.abort();
  }, []);

  const stopGeneration = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    active.controller.abort();
    activeRef.current = null;
    setStreamingId(null);
    patchMessage(active.assistantId, (message) => {
      if (message.status !== "streaming") return message;
      return message.reply?.text.trim()
        ? { ...message, status: "complete" }
        : {
            ...message,
            status: "error",
            error: "Generation stopped. Ask again whenever you're ready.",
            retryable: true,
          };
    });
  }, [patchMessage]);

  /**
   * Install a local, rule-based answer. Used for offline mode, when hosted AI
   * is not configured, and as the graceful fallback when a live request fails
   * before any text has streamed.
   */
  const applyLocalAnswer = useCallback(
    (assistantId: string, guestText: string, noticeText?: string) => {
      const reply = answerMeco(guestText, context, catalog);
      patchMessage(assistantId, (message) => ({
        ...message,
        reply,
        status: "complete",
        error: undefined,
        retryable: false,
      }));
      if (reply.orderLookup) {
        setLookupOpen(true);
        setLookupOrderNumber(reply.orderNumber);
      }
      if (noticeText) setNotice(noticeText);
    },
    [catalog, context, patchMessage],
  );

  const answerLocally = useCallback(
    (assistantId: string, guestText: string) => {
      setStreamingId(assistantId);
      stickRef.current = true;
      if (localTimerRef.current !== null) {
        window.clearTimeout(localTimerRef.current);
      }
      localTimerRef.current = window.setTimeout(
        () => {
          localTimerRef.current = null;
          if (!mountedRef.current) return;
          applyLocalAnswer(assistantId, guestText);
          setStreamingId((current) =>
            current === assistantId ? null : current,
          );
        },
        reduced ? 60 : 300,
      );
    },
    [applyLocalAnswer, reduced],
  );

  const runCompletion = useCallback(
    async (input: {
      guestText: string;
      history: AiChatHistoryMessage[];
      assistantId: string;
    }) => {
      const { guestText, history, assistantId } = input;
      const controller = new AbortController();
      activeRef.current = { controller, assistantId };
      setStreamingId(assistantId);
      stickRef.current = true;

      let streamedText = "";

      try {
        await streamMecoChat({
          request: {
            messages: [
              ...history,
              { role: "user", content: guestText },
            ],
            context: {
              name: context.name?.slice(0, 80),
              cartCount: context.cartCount,
              cartSubtotal: context.cartSubtotal,
              cartItems: context.cartItems.slice(0, 20).map((item) => ({
                name: item.name.slice(0, 160),
                quantity: Math.max(1, Math.min(99, item.quantity)),
                price: item.price,
              })),
              wishlistCount: context.wishlistCount,
              wishlistItems: context.wishlistItems?.slice(0, 12).map((item) => ({
                name: item.name.slice(0, 160),
                price: item.price,
              })),
              recentlyViewed: context.recentlyViewed?.slice(0, 8).map((item) => ({
                name: item.name.slice(0, 160),
                brandName: item.brandName?.slice(0, 120),
                categoryName: item.categoryName?.slice(0, 120),
              })),
              pathname: context.pathname?.slice(0, 300),
            },
          },
          signal: controller.signal,
          onEvent: (event) => {
            if (activeRef.current?.controller !== controller) return;

            if (event.type === "meta") {
              setNotice(null);
              patchMessage(assistantId, (message) => ({
                ...message,
                reply: {
                  ...(message.reply ?? { intent: "smalltalk", text: "" }),
                  suggestions: event.suggestions?.length
                    ? event.suggestions
                    : message.reply?.suggestions,
                  actions: event.actions?.length
                    ? event.actions
                    : message.reply?.actions,
                  orderLookup: event.orderLookup
                    ? true
                    : message.reply?.orderLookup,
                  orderNumber:
                    event.orderNumber ?? message.reply?.orderNumber,
                },
              }));
              if (event.orderLookup) {
                setLookupOpen(true);
                setLookupOrderNumber(event.orderNumber);
              }
              return;
            }

            if (event.type === "delta") {
              streamedText += event.text;
              patchMessage(assistantId, (message) => ({
                ...message,
                reply: {
                  ...(message.reply ?? { intent: "smalltalk", text: "" }),
                  text: `${message.reply?.text ?? ""}${event.text}`,
                },
              }));
              return;
            }

            if (event.type === "products") {
              patchMessage(assistantId, (message) => ({
                ...message,
                reply: {
                  ...(message.reply ?? { intent: "smalltalk", text: "" }),
                  products: event.products,
                  categories: event.categories,
                },
              }));
              return;
            }

            if (event.type === "done") {
              patchMessage(assistantId, (message) =>
                message.status === "streaming"
                  ? { ...message, status: "complete" }
                  : message,
              );
              return;
            }

            if (event.type === "error") {
              if (!streamedText.trim()) {
                applyLocalAnswer(
                  assistantId,
                  guestText,
                  "Live AI is temporarily unavailable, so MECO answered from the on-device edition. Product data, bag and order actions are still live.",
                );
                return;
              }
              patchMessage(assistantId, (message) => ({
                ...message,
                status: "error",
                error: event.error,
                retryable: event.retryable,
              }));
            }
          },
        });

        patchMessage(assistantId, (message) =>
          message.status === "streaming"
            ? { ...message, status: "complete" }
            : message,
        );
      } catch (error) {
        if (!mountedRef.current) return;

        if (isAbortError(error) || controller.signal.aborted) {
          patchMessage(assistantId, (message) => {
            if (message.status !== "streaming") return message;
            return message.reply?.text.trim()
              ? { ...message, status: "complete" }
              : {
                  ...message,
                  status: "error",
                  error: "Generation stopped. Ask again whenever you're ready.",
                  retryable: true,
                };
          });
          return;
        }

        const apiError = error instanceof MecoApiError ? error : null;

        if (apiError?.code === "AI_NOT_CONFIGURED") {
          setLocalMode(true);
          applyLocalAnswer(
            assistantId,
            guestText,
            "Live AI isn't connected yet, so MECO is answering from the on-device edition. Product data, bag and order actions are still live.",
          );
          return;
        }

        const offlineNow =
          typeof navigator !== "undefined" && navigator.onLine === false;
        const canFallBack =
          !streamedText.trim() &&
          (offlineNow ||
            apiError?.code === "UPSTREAM_ERROR" ||
            apiError?.code === "TIMEOUT");

        if (canFallBack) {
          applyLocalAnswer(
            assistantId,
            guestText,
            offlineNow
              ? "You're offline, so MECO is answering from the on-device edition. Your bag is still available."
              : "Live AI is temporarily unavailable, so MECO answered from the on-device edition. Product data, bag and order actions are still live.",
          );
          return;
        }

        patchMessage(assistantId, (message) => ({
          ...message,
          status: "error",
          error:
            apiError?.message ??
            "MECO couldn't reach the atelier. Check your connection and try again.",
          retryable: apiError ? apiError.code !== "INVALID_REQUEST" : true,
        }));
      } finally {
        if (activeRef.current?.controller === controller) {
          activeRef.current = null;
          if (mountedRef.current) setStreamingId(null);
        }
      }
    },
    [applyLocalAnswer, context, patchMessage],
  );

  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT_CHARS);
      if (!text || streamingId) return;

      setInput("");
      setNotice(null);
      setLookupOpen(false);
      setLookupOrderNumber(undefined);
      stickRef.current = true;

      const history = toHistory(messages);
      const guestId = nextMessageId();
      const assistantId = nextMessageId();

      const guestMessage: MecoChatMessage = {
        id: guestId,
        role: "guest",
        text,
        status: "complete",
        createdAt: Date.now(),
      };
      const placeholder: MecoChatMessage = {
        id: assistantId,
        role: "meco",
        status: "streaming",
        createdAt: Date.now(),
        reply: { intent: "smalltalk", text: "" },
      };

      setMessages((current) => [...current, guestMessage, placeholder]);

      const offlineNow =
        typeof navigator !== "undefined" && navigator.onLine === false;

      if (offlineNow || localMode) {
        if (offlineNow) {
          setNotice(
            "You're offline, so MECO is answering from the on-device edition. Your bag is still available.",
          );
        }
        answerLocally(assistantId, text);
        return;
      }

      void runCompletion({ guestText: text, history, assistantId });
    },
    [
      answerLocally,
      localMode,
      messages,
      runCompletion,
      streamingId,
    ],
  );

  const retry = useCallback(
    (assistantId: string) => {
      if (streamingId) return;
      const index = messages.findIndex(
        (message) => message.id === assistantId,
      );
      if (index < 0 || index !== messages.length - 1) return;

      let guestIndex = index - 1;
      while (guestIndex >= 0 && messages[guestIndex].role !== "guest") {
        guestIndex -= 1;
      }
      if (guestIndex < 0) return;

      const guest = messages[guestIndex];
      const text = guest.text?.trim().slice(0, MAX_INPUT_CHARS);
      if (!text) return;

      const history = toHistory(messages.slice(0, guestIndex));
      const nextAssistantId = nextMessageId();

      setMessages((current) => [
        ...current.slice(0, index),
        {
          id: nextAssistantId,
          role: "meco",
          status: "streaming",
          createdAt: Date.now(),
          reply: { intent: "smalltalk", text: "" },
        },
      ]);
      setNotice(null);
      stickRef.current = true;

      const offlineNow =
        typeof navigator !== "undefined" && navigator.onLine === false;
      if (offlineNow || localMode) {
        answerLocally(nextAssistantId, text);
        return;
      }

      void runCompletion({
        guestText: text,
        history,
        assistantId: nextAssistantId,
      });
    },
    [
      answerLocally,
      localMode,
      messages,
      runCompletion,
      streamingId,
    ],
  );

  const addToBag = useCallback(
    async (product: AssistantProduct) => {
      if (product.stock <= 0) return;
      setAddingId(product.id);
      try {
        await cart.addItem({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image ?? "",
          quantity: 1,
          size: product.sizes[0],
          color: product.colors[0],
        });
        toast.success(`${product.name} added to your bag`, {
          description: "MECO is carrying it to the cart.",
        });
      } catch {
        toast.error("MECO couldn't add that piece", {
          description: "Please try again from the product page.",
        });
      } finally {
        setAddingId(null);
      }
    },
    [cart],
  );

  const saveToWishlist = useCallback(
    async (product: AssistantProduct) => {
      const alreadySaved = savedIds.has(product.id);
      try {
        await wishlist.toggle({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image ?? "",
        });
        toast.success(
          alreadySaved
            ? `${product.name} removed from your wishlist`
            : `${product.name} saved to your wishlist`,
          {
            description: alreadySaved
              ? "You can add it back whenever you like."
              : "MECO will keep it with your saved pieces.",
          },
        );
      } catch {
        toast.error("MECO couldn't update your wishlist", {
          description: "Please try again in a moment.",
        });
      }
    },
    [savedIds, wishlist],
  );

  const clearConversation = useCallback(() => {
    abortActive();
    if (localTimerRef.current !== null) {
      window.clearTimeout(localTimerRef.current);
      localTimerRef.current = null;
    }
    setStreamingId(null);
    clearStoredConversation();
    setMessages([greetingMessage(contextRef.current, catalog)]);
    setInput("");
    setNotice(null);
    setLookupOpen(false);
    setLookupOrderNumber(undefined);
    stickRef.current = true;
    toast.message("New conversation", {
      description: "MECO kept the live catalogue and your bag in view.",
    });
  }, [abortActive, catalog]);

  // Load the stored conversation only when the panel first opens. The greeting
  // is prepared immediately so the panel never looks empty while it hydrates.
  useEffect(() => {
    if (!open || hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = loadConversation();
    setMessages(
      stored?.length
        ? stored
        : [greetingMessage(contextRef.current, catalog)],
    );
  }, [catalog, open]);

  useEffect(() => {
    if (!open || catalogState !== "idle") return;
    fetchAssistantCatalog()
      .then((payload) => {
        if (!mountedRef.current) return;
        const nextCatalog: AssistantCatalog = {
          products: payload.products,
          categories: payload.categories,
        };
        setCatalog(nextCatalog);
        setCatalogState("ready");
        if (!payload.aiConfigured) setLocalMode(true);
        setMessages((current) => {
          if (current.length !== 1) return current;
          const only = current[0];
          if (
            only.role !== "meco" ||
            only.reply?.intent !== "greeting" ||
            only.status === "streaming"
          ) {
            return current;
          }
          return [greetingMessage(contextRef.current, nextCatalog)];
        });
      })
      .catch(() => {
        if (mountedRef.current) setCatalogState("error");
      });
  }, [catalogState, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (window.matchMedia("(min-width: 640px)").matches) {
        inputRef.current?.focus();
      } else {
        panelRef.current?.focus();
      }
    }, 90);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    if (!stickRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollTo({
        top: node.scrollHeight,
        behavior:
          streamingId || reduced || messages.length === 1 ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lookupOpen, messages, open, reduced, streamingId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const timer = window.setTimeout(() => saveConversation(messages), 400);
    return () => window.clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    const onPageHide = () => saveConversation(messagesRef.current);
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 104)}px`;
  }, [input, open]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRef.current?.controller.abort();
      activeRef.current = null;
      if (localTimerRef.current !== null) {
        window.clearTimeout(localTimerRef.current);
        localTimerRef.current = null;
      }
      saveConversation(messagesRef.current);
    };
  }, []);

  const activeMessage = streamingId
    ? messages.find((message) => message.id === streamingId)
    : undefined;
  const typing = Boolean(
    activeMessage &&
      !activeMessage.reply?.text.trim() &&
      !activeMessage.error,
  );

  const suggestions = streamingId ? [] : latestSuggestions(messages);

  const canClear = messages.length > 1;
  const statusTone =
    !online || localMode || catalogState === "error" ? "gold" : "emerald";
  const statusText = !online
    ? "Offline · on-device answers"
    : localMode
      ? "Atelier mode · on-device answers"
      : catalogState === "ready" && catalog
        ? `${catalog.products.length} live pieces · AI concierge`
        : catalogState === "error"
          ? "AI concierge · catalogue reconnecting"
          : "Opening the atelier";

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={openAssistant}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open MECO, the AI shopping concierge"
        className="meco-glass group fixed bottom-4 right-4 z-[110] flex h-14 items-center gap-2 rounded-full border py-1.5 pl-2 pr-4 text-[var(--lx-text)] shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:border-[var(--lx-gold)]/50 hover:shadow-[0_20px_70px_rgba(212,175,55,0.16)] sm:bottom-6 sm:right-6"
      >
        <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--lx-iris)]/30 to-[var(--lx-cyan)]/20">
          <RiderModel
            phase="idle"
            tier={1}
            waving
            headlight={false}
            reduced={reduced}
            className="h-8 w-10"
          />
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--lx-panel)]",
              statusTone === "emerald"
                ? "bg-[var(--lx-emerald)]"
                : "bg-[var(--lx-gold)]",
            )}
          />
        </span>
        <span className="text-left">
          <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
            AI concierge
          </span>
          <span className="block text-xs font-semibold tracking-wide">
            Ask MECO
          </span>
        </span>
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[120] bg-[#0B0B0F]/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-0"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? { duration: 0 } : undefined}
            onClick={close}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="meco-title"
              aria-describedby="meco-description"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              initial={
                reduced ? false : { opacity: 0, y: 28, scale: 0.97 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 34 }
              }
              className="meco-glass absolute inset-x-2 bottom-2 flex max-h-[88svh] flex-col overflow-hidden rounded-[1.75rem] border shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px]"
              style={{ height: "min(700px, 88svh)" }}
            >
              <p id="meco-description" className="sr-only">
                Ask MECO about products, categories, your bag, wishlist,
                delivery or orders. MECO replies with live catalogue information
                and can open the relevant storefront page.
              </p>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--lx-gold)]/[0.07] to-transparent"
              />

              <div className="relative flex items-center gap-3 border-b border-[var(--lx-border)] px-4 py-3">
                <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--lx-iris)]/20 to-[var(--lx-cyan)]/10">
                  <RiderModel
                    phase="idle"
                    tier={1}
                    waving
                    headlight={false}
                    reduced={reduced}
                    className="h-9 w-12"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2
                      id="meco-title"
                      className="text-sm font-semibold tracking-wide text-[var(--lx-text)]"
                    >
                      MECO
                    </h2>
                    <span className="rounded-full border border-[var(--lx-gold)]/30 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--lx-gold)]">
                      {localMode ? "Atelier mode" : "Atelier AI"}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[var(--lx-muted)]"
                    aria-live="polite"
                  >
                    {online ? (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          statusTone === "emerald"
                            ? "bg-[var(--lx-emerald)]"
                            : "bg-[var(--lx-gold)]",
                        )}
                      />
                    ) : (
                      <WifiOff className="h-3 w-3" aria-hidden />
                    )}
                    {statusText}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={clearConversation}
                  disabled={!canClear}
                  aria-label="Start a new conversation"
                  title="Start a new conversation"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)] disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  type="button"
                  onClick={close}
                  aria-label="Close MECO"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              {notice ? (
                <div
                  className="relative flex items-start gap-2 border-b border-[var(--lx-gold)]/15 bg-[var(--lx-gold)]/[0.06] px-4 py-2"
                  role="status"
                >
                  <p className="flex-1 text-[10px] leading-4 text-[var(--lx-gold)]/90">
                    {notice}
                  </p>
                  <Button
                    type="button"
                    onClick={() => setNotice(null)}
                    aria-label="Dismiss notice"
                    className="text-[var(--lx-gold)]/60 transition hover:text-[var(--lx-gold)]"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </Button>
                </div>
              ) : null}

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={Boolean(streamingId)}
                onScroll={() => {
                  const node = scrollRef.current;
                  if (!node) return;
                  stickRef.current =
                    node.scrollHeight - node.scrollTop - node.clientHeight < 96;
                }}
                className="meco-scroll relative flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin]"
              >
                {messages.map((message, index) => {
                  if (message.role === "guest") {
                    const time = messageTime(message.createdAt);
                    return (
                      <div
                        key={message.id}
                        className="flex flex-col items-end gap-1"
                      >
                        <p className="meco-bubble-guest max-w-[85%] break-words rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] leading-5">
                          {message.text}
                        </p>
                        {time ? (
                          <time
                            dateTime={time.iso}
                            className="pr-1 font-mono text-[8px] tracking-wide text-[var(--lx-faint)]"
                          >
                            {time.label}
                          </time>
                        ) : null}
                      </div>
                    );
                  }

                  const isActive = message.id === streamingId;
                  const showTyping = isActive && typing;
                  const showBubble = Boolean(
                    showTyping ||
                      message.reply?.text.trim() ||
                      message.reply?.products?.length,
                  );
                  const isLast = index === messages.length - 1;
                  const time = showTyping ? null : messageTime(message.createdAt);

                  return (
                    <div key={message.id} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--lx-cyan)]/15 font-mono text-[8px] font-bold text-[var(--lx-cyan)]">
                        M
                      </span>
                      <div className="min-w-0 max-w-[calc(100%-2rem)] space-y-2">
                        {showBubble ? (
                          <div className="meco-bubble rounded-2xl rounded-tl-md border p-3">
                            {showTyping ? (
                              <div
                                className="flex items-center gap-1.5 py-1"
                                aria-label="MECO is thinking"
                                role="status"
                              >
                                {[0, 1, 2].map((dot) => (
                                  <motion.span
                                    key={dot}
                                    aria-hidden
                                    className="h-1.5 w-1.5 rounded-full bg-[var(--lx-cyan)]/70"
                                    animate={
                                      reduced
                                        ? undefined
                                        : {
                                            opacity: [0.25, 1, 0.25],
                                            y: [0, -3, 0],
                                          }
                                    }
                                    transition={{
                                      duration: 1,
                                      repeat: Infinity,
                                      delay: dot * 0.16,
                                    }}
                                  />
                                ))}
                              </div>
                            ) : message.reply ? (
                              <ReplyBody
                                reply={message.reply}
                                onAdd={(product) => void addToBag(product)}
                                addingId={addingId}
                                savedIds={savedIds}
                                onSave={(product) =>
                                  void saveToWishlist(product)
                                }
                                onNavigate={close}
                                streaming={isActive}
                              />
                            ) : null}
                          </div>
                        ) : null}

                        {time ? (
                          <time
                            dateTime={time.iso}
                            className="block pl-1 font-mono text-[8px] tracking-wide text-[var(--lx-faint)]"
                          >
                            {time.label}
                          </time>
                        ) : null}

                        {message.error ? (
                          <MessageError
                            message={message.error}
                            retryable={Boolean(
                              message.retryable && isLast && !streamingId,
                            )}
                            onRetry={() => retry(message.id)}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {lookupOpen ? (
                  <MecoOrderLookup
                    key={lookupOrderNumber ?? "lookup"}
                    initialOrderNumber={lookupOrderNumber}
                    onClose={() => {
                      setLookupOpen(false);
                      setLookupOrderNumber(undefined);
                    }}
                  />
                ) : null}
              </div>

              {voice.error ? (
                <p
                  className="border-t border-[var(--lx-border)] px-4 py-2 text-[10px] text-[var(--lx-gold)]"
                  role="status"
                >
                  {voice.error}
                </p>
              ) : null}

              {suggestions.length ? (
                <div className="flex gap-1.5 overflow-x-auto border-t border-[var(--lx-border)] px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      disabled={Boolean(streamingId)}
                      className="shrink-0 rounded-full border border-[var(--lx-border)] px-2.5 py-1 text-[10px] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)] disabled:opacity-40"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submit(input);
                }}
                className="border-t border-[var(--lx-border)] px-2.5 pb-2 pt-2"
              >
                <div className="meco-composer flex items-end gap-1.5 rounded-2xl border p-1.5 transition focus-within:border-[var(--lx-cyan)]/40">
                  <label htmlFor="meco-input" className="sr-only">
                    Ask MECO
                  </label>
                  <textarea
                    ref={inputRef}
                    id="meco-input"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        submit(input);
                      }
                    }}
                    rows={1}
                    maxLength={MAX_INPUT_CHARS}
                    placeholder="Ask about a piece, your bag or an order"
                    autoComplete="off"
                    className="max-h-[104px] min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[12px] leading-5 text-[var(--lx-text)] placeholder:text-[var(--lx-faint)] focus:outline-none"
                  />
                  {voice.supported ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (voice.listening) voice.stop();
                        else voice.start();
                      }}
                      aria-label={
                        voice.listening ? "Stop voice input" : "Speak to MECO"
                      }
                      aria-pressed={voice.listening}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition",
                        voice.listening
                          ? "border-[var(--lx-cyan)]/50 bg-[var(--lx-cyan)]/15 text-[var(--lx-cyan)]"
                          : "border-transparent text-[var(--lx-muted)] hover:text-[var(--lx-text)]",
                      )}
                    >
                      <Mic
                        className={cn(
                          "h-4 w-4",
                          voice.listening && "animate-pulse",
                        )}
                        aria-hidden
                      />
                    </Button>
                  ) : null}
                  {streamingId ? (
                    <Button
                      type="button"
                      onClick={stopGeneration}
                      aria-label="Stop MECO's answer"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]"
                    >
                      <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!input.trim()}
                      aria-label="Send message to MECO"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lx-gold)] text-[var(--lx-bg)] transition hover:bg-[var(--lx-gold-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
                {input.length > MAX_INPUT_CHARS - 400 ? (
                  <p className="mt-1 px-1 text-right font-mono text-[8px] text-[var(--lx-gold)]/80">
                    {input.length.toLocaleString()} /{" "}
                    {MAX_INPUT_CHARS.toLocaleString()}
                  </p>
                ) : null}
              </form>

              <p className="meco-footer flex items-center justify-center gap-1.5 border-t border-[var(--lx-border)] py-1.5 text-[8px] text-[var(--lx-faint)]">
                <Sparkles className="h-2.5 w-2.5" aria-hidden />
                MECO can make mistakes. Prices and stock are confirmed in the
                bag.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

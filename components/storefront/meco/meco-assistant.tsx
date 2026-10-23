"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  Mic,
  PackageSearch,
  Send,
  ShoppingBag,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RiderModel } from "@/components/storefront/rider/rider-model";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useVoiceSearch } from "@/lib/hooks/use-voice-search";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { usePrefersReducedMotion } from "@/lib/motion";
import { fetchAssistantCatalog } from "@/lib/ai/catalog-client";
import {
  answerMeco,
  mecoInitialReply,
  type AssistantAction,
  type AssistantCatalog,
  type AssistantContext,
  type AssistantProduct,
  type AssistantReply,
} from "@/lib/ai/assistant";
import { lookupMyOrder, type MecoOrderLookup } from "@/lib/actions/meco";
import { deriveTracking } from "@/lib/tracking";
import { cn } from "@/lib/cn";

type ChatMessage = {
  id: string;
  role: "meco" | "guest";
  text?: string;
  reply?: AssistantReply;
};

let messageSequence = 0;
function nextId() {
  messageSequence += 1;
  return `meco-${messageSequence}`;
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function AssistantProductCard({
  product,
  onAdd,
  adding,
  onNavigate,
}: {
  product: AssistantProduct;
  onAdd: (product: AssistantProduct) => void;
  adding: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--lx-glass-border)] bg-[var(--lx-surface)]/70">
      <Link
        href={`/products/${product.slug}`}
        onClick={onNavigate}
        className="group block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="180px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--lx-muted)]">
              {product.name.charAt(0)}
            </span>
          )}
          {product.stock <= 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-[#080a16]/80 px-2 py-0.5 text-[8px] uppercase tracking-[0.14em] text-white/70">
              Waitlist
            </span>
          ) : null}
        </div>
        <div className="px-2.5 pb-1 pt-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-[var(--lx-muted)]">
            {product.brandName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-4 text-[var(--lx-text)]">
            {product.name}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[var(--lx-gold)]">
            ${product.price.toFixed(2)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => onAdd(product)}
        disabled={adding || product.stock <= 0}
        className="flex w-full items-center justify-center gap-1.5 border-t border-[var(--lx-glass-border)] py-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--lx-muted)] transition hover:bg-[var(--lx-gold)]/10 hover:text-[var(--lx-gold)] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Add ${product.name} to bag`}
      >
        {adding ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <ShoppingBag className="h-3 w-3" aria-hidden />}
        {product.stock <= 0 ? "Waitlist" : "Add to bag"}
      </button>
    </div>
  );
}

function ReplyBody({
  reply,
  onAdd,
  addingId,
  onNavigate,
}: {
  reply: AssistantReply;
  onAdd: (product: AssistantProduct) => void;
  addingId: string | null;
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-line text-[13px] leading-6 text-[var(--lx-text)]/90">{reply.text}</p>

      {reply.products?.length ? (
        <div className="grid grid-cols-2 gap-2">
          {reply.products.slice(0, 4).map((product) => (
            <AssistantProductCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              adding={addingId === product.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}

      {reply.categories?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {reply.categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              onClick={onNavigate}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--lx-glass-border)] px-2.5 py-1 text-[10px] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
            >
              {category.name}
              <span className="font-mono text-[9px] text-[var(--lx-muted)]/60">{category.productCount}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {reply.actions?.length ? (
        <div className="flex flex-wrap gap-2">
          {reply.actions.map((action) => (
            <AssistantActionLink key={`${action.label}-${action.href}`} action={action} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssistantActionLink({
  action,
  onNavigate,
}: {
  action: AssistantAction;
  onNavigate: () => void;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-[var(--lx-gold)]/35 bg-[var(--lx-gold)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--lx-gold)] transition hover:bg-[var(--lx-gold)]/20";
  if (action.href.startsWith("mailto:") || action.href.startsWith("http")) {
    return (
      <a href={action.href} target={action.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={className}>
        {action.label}
        <ArrowRight className="h-3 w-3" aria-hidden />
      </a>
    );
  }
  return (
    <Link href={action.href} onClick={onNavigate} className={className}>
      {action.label}
      <ArrowRight className="h-3 w-3" aria-hidden />
    </Link>
  );
}

export function MecoAssistant() {
  const auth = useAuth();
  const cart = useCart();
  const wishlist = useWishlist();
  const online = useOnlineStatus();
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [catalog, setCatalog] = useState<AssistantCatalog | null>(null);
  const [catalogState, setCatalogState] = useState<"idle" | "ready" | "error">("idle");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupValue, setLookupValue] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "done">("idle");
  const [lookupResult, setLookupResult] = useState<MecoOrderLookup | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startedRef = useRef(false);
  const catalogRequestRef = useRef(false);
  const mountedRef = useRef(true);

  const context = useMemo<AssistantContext>(
    () => ({
      name: auth.user?.name,
      cartCount: cart.count,
      cartSubtotal: cart.subtotal,
      cartItems: cart.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      wishlistCount: wishlist.items.length,
    }),
    [auth.user?.name, cart.count, cart.subtotal, cart.items, wishlist.items.length],
  );

  const voice = useVoiceSearch({
    onResult: (transcript) => {
      setInput(transcript);
      inputRef.current?.focus();
      toast.message("Voice search ready", { description: `“${transcript}”` });
    },
  });

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 30);
  }, []);

  const openAssistant = useCallback(() => {
    setOpen(true);
    if (startedRef.current) return;
    startedRef.current = true;
    setMessages([
      {
        id: nextId(),
        role: "meco",
        reply: mecoInitialReply(context, catalog),
      },
    ]);
  }, [catalog, context]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
  }, [open, close]);

  useEffect(() => {
    if (!open || catalogState === "ready" || catalogRequestRef.current) return;
    catalogRequestRef.current = true;
    fetchAssistantCatalog()
      .then((result) => {
        if (!mountedRef.current) return;
        setCatalog(result);
        setCatalogState("ready");
        setMessages((current) => {
          if (current.length !== 1 || current[0].reply?.intent !== "greeting") return current;
          return [
            {
              id: current[0].id,
              role: "meco",
              reply: mecoInitialReply(context, result),
            },
          ];
        });
      })
      .catch(() => {
        if (mountedRef.current) setCatalogState("error");
      });
  }, [open, catalogState, context]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      if (window.matchMedia("(min-width: 640px)").matches) inputRef.current?.focus();
      else panelRef.current?.focus();
    }, 70);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [messages, typing, lookupOpen, lookupResult, open, reduced]);

  const runLookup = useCallback(async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setLookupStatus("loading");
    setLookupResult(null);
    const result = await lookupMyOrder(clean);
    setLookupResult(result);
    setLookupStatus("done");
  }, []);

  const submit = useCallback(
    (value: string) => {
      const message = value.trim();
      if (!message || typing) return;
      setInput("");
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "guest", text: message },
      ]);
      setTyping(true);
      const reply = answerMeco(message, context, catalog);
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { id: nextId(), role: "meco", reply },
        ]);
        setTyping(false);
        if (reply.orderLookup) {
          setLookupOpen(true);
          if (reply.orderNumber) {
            setLookupValue(reply.orderNumber);
            void runLookup(reply.orderNumber);
          }
        }
      }, reduced ? 80 : 320);
    },
    [catalog, context, reduced, runLookup, typing],
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
      } finally {
        setAddingId(null);
      }
    },
    [cart],
  );

  const lastReply = [...messages].reverse().find((message) => message.reply)?.reply;
  const suggestions = lastReply?.suggestions?.slice(0, 4) ?? [];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openAssistant}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group fixed bottom-4 right-4 z-[110] flex h-14 items-center gap-2 rounded-full border border-white/15 bg-[#0b0f18]/95 py-1.5 pl-2 pr-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:border-[var(--lx-gold)]/50 hover:shadow-[0_20px_70px_rgba(240,196,108,0.16)] sm:bottom-6 sm:right-6"
      >
        <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--lx-iris)]/30 to-[var(--lx-cyan)]/20">
          <RiderModel phase="idle" tier={1} waving headlight={false} reduced={reduced} className="h-8 w-10" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b0f18] bg-[var(--lx-emerald)]" />
        </span>
        <span className="text-left">
          <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--lx-cyan)]">
            AI concierge
          </span>
          <span className="block text-xs font-semibold tracking-wide">Ask MECO</span>
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[120] bg-[#04050d]/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="meco-title"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="lx-dark-scene absolute inset-x-2 bottom-2 flex max-h-[88svh] flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#080b15] shadow-[0_30px_120px_rgba(0,0,0,0.7)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
              style={{ height: "min(680px, 88svh)" }}
            >
              <div className="relative flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
                <span className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--lx-iris)]/20 to-[var(--lx-cyan)]/10">
                  <RiderModel phase="idle" tier={1} waving headlight={false} reduced={reduced} className="h-9 w-12" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 id="meco-title" className="text-sm font-semibold tracking-wide text-white">
                      MECO
                    </h2>
                    <span className="rounded-full border border-[var(--lx-gold)]/30 px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-[var(--lx-gold)]">
                      Atelier AI
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/45">
                    {online ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--lx-emerald)]" />
                        {catalogState === "ready" && catalog
                          ? `${catalog.products.length} live pieces · here to help`
                          : "Opening the catalogue"}
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" aria-hidden />
                        Offline · bag & FAQ still work
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close MECO"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-white/25 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin]"
              >
                {messages.map((message) =>
                  message.role === "guest" ? (
                    <div key={message.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-[var(--lx-gold)]/25 to-[var(--lx-gold)]/10 px-3.5 py-2.5 text-[13px] leading-5 text-white">
                        {message.text}
                      </p>
                    </div>
                  ) : (
                    <div key={message.id} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--lx-cyan)]/15 font-mono text-[8px] font-bold text-[var(--lx-cyan)]">
                        M
                      </span>
                      <div className="max-w-[calc(100%-2rem)] rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.045] p-3">
                        {message.reply ? (
                          <ReplyBody
                            reply={message.reply}
                            onAdd={(product) => void addToBag(product)}
                            addingId={addingId}
                            onNavigate={close}
                          />
                        ) : null}
                      </div>
                    </div>
                  ),
                )}

                {typing ? (
                  <div className="flex items-center gap-1.5 pl-8" aria-label="MECO is typing">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full bg-[var(--lx-cyan)]/70"
                        animate={reduced ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                        transition={{ duration: 1, repeat: Infinity, delay: dot * 0.16 }}
                      />
                    ))}
                  </div>
                ) : null}

                {lookupOpen ? (
                  <div className="ml-8 rounded-2xl border border-[var(--lx-cyan)]/20 bg-[var(--lx-cyan)]/[0.055] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--lx-cyan)]">
                        <PackageSearch className="h-3.5 w-3.5" aria-hidden />
                        Order lookup
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setLookupOpen(false);
                          setLookupResult(null);
                          setLookupStatus("idle");
                        }}
                        className="text-white/35 transition hover:text-white"
                        aria-label="Close order lookup"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <form
                      className="mt-2 flex gap-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void runLookup(lookupValue);
                      }}
                    >
                      <label htmlFor="meco-order-number" className="sr-only">
                        Order number
                      </label>
                      <input
                        id="meco-order-number"
                        value={lookupValue}
                        onChange={(event) => setLookupValue(event.target.value)}
                        placeholder="ORD-20261022-100001"
                        autoComplete="off"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 font-mono text-[10px] uppercase tracking-wide text-white placeholder:text-white/25 focus:border-[var(--lx-cyan)]/50 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={lookupStatus === "loading" || !lookupValue.trim()}
                        className="flex h-8 items-center justify-center rounded-xl bg-[var(--lx-cyan)] px-3 text-[10px] font-semibold text-[#071018] transition hover:bg-[var(--lx-cyan)]/90 disabled:opacity-50"
                      >
                        {lookupStatus === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : "Find"}
                      </button>
                    </form>

                    {lookupResult?.ok ? (
                      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-[10px] text-white">{lookupResult.order.orderNumber}</p>
                          <span className="rounded-full bg-[var(--lx-emerald)]/15 px-2 py-0.5 text-[9px] font-medium text-[var(--lx-emerald)]">
                            {deriveTracking(lookupResult.order).statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/45">
                          {statusLabel(lookupResult.order.paymentStatus)} · ${lookupResult.order.total.toFixed(2)} · updated{" "}
                          {new Date(lookupResult.order.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <Link
                          href={`/orders/${lookupResult.order.id}/track`}
                          onClick={close}
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--lx-gold)] hover:underline"
                        >
                          Open live tracking
                          <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      </div>
                    ) : null}

                    {lookupResult && !lookupResult.ok ? (
                      <p className="mt-2 text-[10px] leading-4 text-white/55" role="status">
                        {lookupResult.reason === "auth"
                          ? "Sign in to the account that placed the order, then ask me again."
                          : lookupResult.reason === "not_found"
                            ? "I couldn't find that number on your account. Check the order confirmation, or open your orders."
                            : lookupResult.reason === "invalid"
                              ? "That doesn't look like a MeCart order number. Use the format ORD-YYYYMMDD-######."
                              : "The order ledger is unavailable right now. Please try again in a moment."}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {voice.error ? (
                <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-[var(--lx-gold)]" role="status">
                  {voice.error}
                </p>
              ) : null}

              {suggestions.length ? (
                <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.06] px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submit(suggestion)}
                      className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/60 transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submit(input);
                }}
                className="flex items-center gap-1.5 border-t border-white/[0.08] px-2.5 py-2.5"
              >
                <label htmlFor="meco-input" className="sr-only">
                  Ask MECO
                </label>
                <input
                  ref={inputRef}
                  id="meco-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about a piece, your bag or an order"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] text-white placeholder:text-white/30 focus:border-[var(--lx-cyan)]/50 focus:outline-none"
                />
                {voice.supported ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (voice.listening) voice.stop();
                      else voice.start();
                    }}
                    aria-label={voice.listening ? "Stop voice input" : "Speak to MECO"}
                    aria-pressed={voice.listening}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition",
                      voice.listening
                        ? "border-[var(--lx-cyan)]/50 bg-[var(--lx-cyan)]/15 text-[var(--lx-cyan)]"
                        : "border-white/10 text-white/45 hover:text-white",
                    )}
                  >
                    <Mic className={cn("h-4 w-4", voice.listening && "animate-pulse")} aria-hidden />
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  aria-label="Send message to MECO"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--lx-gold)] text-[#17120a] transition hover:bg-[var(--lx-gold-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </form>

              <p className="flex items-center justify-center gap-1.5 border-t border-white/[0.05] bg-black/20 py-1.5 text-[8px] text-white/25">
                <Sparkles className="h-2.5 w-2.5" aria-hidden />
                MECO can make mistakes. Prices and stock are confirmed in the bag.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

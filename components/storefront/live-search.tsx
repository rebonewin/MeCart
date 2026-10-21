"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock3, Flame, Loader2, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { Shimmer } from "@/components/luxe/primitives";

type Hit = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  category: string;
};

type HitRow = {
  id: string;
  name: string;
  slug: string;
  final_price: number | string;
  product_images: { url: string; position: number }[] | null;
  categories: { name: string } | null;
};

const RECENT_KEY = "mecart.recent-searches";
const POPULAR = ["Watches", "Sneakers", "Headphones", "Fragrance", "New arrivals"];

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function LiveSearch({
  size = "lg",
  className,
  placeholder = "Search the atelier — products, collections, drops…",
  onNavigate,
  autoFocus = false,
}: {
  size?: "lg" | "sm";
  className?: string;
  placeholder?: string;
  onNavigate?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecent(),
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (autoFocus) {
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
        setOpen(true);
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [autoFocus]);

  const remember = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecent((current) => {
      const next = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // storage can be unavailable in private mode
      }
      return next;
    });
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setActive(-1);
    const term = value.trim();
    if (term.length >= 2) {
      setLoading(true);
      setOpen(true);
    } else {
      setHits([]);
      setLoading(false);
      setOpen(true);
    }
  };

  useEffect(() => {
    const term = query.trim();
    const id = ++requestRef.current;
    if (term.length < 2) return;
    const timer = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, final_price, product_images(url, position), categories(name)")
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .ilike("name", `%${term}%`)
          .order("rating", { ascending: false })
          .limit(6);
        if (requestRef.current !== id) return;
        const rows = (data ?? []) as unknown as HitRow[];
        setHits(
          rows.map((row) => {
            const images = [...(row.product_images ?? [])].sort((a, b) => a.position - b.position);
            return {
              id: row.id,
              name: row.name,
              slug: row.slug,
              image: images[0]?.url ?? null,
              price: Number(row.final_price),
              category: row.categories?.name ?? "Collection",
            };
          }),
        );
        setActive(-1);
      } catch {
        if (requestRef.current === id) setHits([]);
      } finally {
        if (requestRef.current === id) setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  };

  const submit = () => {
    const term = query.trim();
    if (!term) return;
    remember(term);
    if (active >= 0 && hits[active]) {
      go(`/products/${hits[active].slug}`);
      return;
    }
    go(`/search?q=${encodeURIComponent(term)}`);
  };

  const runTerm = (term: string) => {
    setQuery(term);
    remember(term);
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (hits.length) setActive((current) => Math.min(current + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const large = size === "lg";
  const shortQuery = query.trim().length < 2;
  const showMemory = shortQuery && (recent.length > 0 || POPULAR.length > 0);

  return (
    <div ref={boxRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        role="search"
        className="group relative"
      >
        <div
          className={cn(
            "lx-glass lx-panel-glow flex items-center gap-3 rounded-full transition-all duration-300 focus-within:border-[var(--lx-gold)]/45",
            large ? "h-14 pl-5 pr-2" : "h-11 pl-4 pr-1.5",
          )}
        >
          <Search className={cn("shrink-0 text-[var(--lx-muted)]", large ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label="Search products"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            role="combobox"
            autoComplete="off"
            className={cn(
              "peer w-full bg-transparent text-white outline-none placeholder:text-[var(--lx-muted)]/70 [&::-webkit-search-cancel-button]:hidden",
              large ? "text-sm sm:text-base" : "text-sm",
            )}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setHits([]);
                setActive(-1);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--lx-muted)] transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--lx-cyan)]" aria-hidden />
          ) : null}
          <button
            type="submit"
            className={cn(
              "shrink-0 rounded-full bg-gradient-to-r from-[var(--lx-iris)] to-[var(--lx-cyan)] font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-95",
              large ? "h-10 px-5 text-sm" : "h-8 px-3.5 text-xs",
            )}
          >
            Search
          </button>
        </div>
      </form>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lx-glass absolute left-0 right-0 top-[calc(100%+10px)] z-[70] max-h-[70vh] overflow-y-auto rounded-2xl bg-[#0a0c1a]/97 p-2 shadow-2xl shadow-black/60"
          >
            {showMemory ? (
              <div className="p-2">
                {recent.length ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-2">
                      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                        <Clock3 className="h-3 w-3" aria-hidden /> Recent
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setRecent([]);
                          try {
                            window.localStorage.removeItem(RECENT_KEY);
                          } catch {
                            // ignore
                          }
                        }}
                        className="text-[10px] text-[var(--lx-muted)] transition hover:text-white"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 px-2">
                      {recent.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => runTerm(term)}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/75 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="flex items-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                    <Flame className="h-3 w-3 text-[var(--lx-gold)]" aria-hidden /> Popular now
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 px-2 pb-1">
                    {POPULAR.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => runTerm(term)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/75 transition hover:border-[var(--lx-gold)]/40 hover:bg-[var(--lx-gold)]/10 hover:text-[var(--lx-gold)]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : loading && hits.length === 0 ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex items-center gap-3 p-2">
                    <Shimmer className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer className="h-3 w-2/3" />
                      <Shimmer className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hits.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-white/80">No matches for “{query.trim()}”.</p>
                <p className="mt-1 text-xs text-[var(--lx-muted)]">Try a category, a brand or a shorter keyword.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {POPULAR.slice(0, 3).map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => runTerm(term)}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul id={listId} role="listbox" aria-label="Search results" className="space-y-0.5">
                {hits.map((hit, index) => (
                  <li key={hit.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => {
                        remember(query);
                        go(`/products/${hit.slug}`);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                        index === active ? "bg-white/10" : "hover:bg-white/5",
                      )}
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        {hit.image ? (
                          <Image src={hit.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{hit.name}</span>
                        <span className="block text-xs text-[var(--lx-muted)]">{hit.category}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[var(--lx-gold)]">
                        ${hit.price.toFixed(2)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!showMemory ? (
              <button
                type="button"
                onClick={submit}
                className="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-[var(--lx-cyan)] transition hover:bg-white/5"
              >
                View all results for “{query.trim()}”
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

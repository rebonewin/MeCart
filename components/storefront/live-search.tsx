"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search } from "lucide-react";
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

export function LiveSearch({
  size = "lg",
  className,
  placeholder = "Search the atelier — products, collections, drops…",
  onNavigate,
}: {
  size?: "lg" | "sm";
  className?: string;
  placeholder?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

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
      setOpen(false);
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
    if (active >= 0 && hits[active]) {
      go(`/products/${hits[active].slug}`);
      return;
    }
    go(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const large = size === "lg";

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
            "lx-glass lx-panel-glow flex items-center gap-3 rounded-full transition-all duration-300 focus-within:border-white/25 focus-within:bg-white/10",
            large ? "h-14 pl-5 pr-2" : "h-11 pl-4 pr-1.5",
          )}
        >
          <Search className={cn("shrink-0 text-[var(--lx-muted)]", large ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
            placeholder={placeholder}
            aria-label="Search products"
            autoComplete="off"
            className={cn(
              "peer w-full bg-transparent text-white outline-none placeholder:text-[var(--lx-muted)]/70 [&::-webkit-search-cancel-button]:hidden",
              large ? "text-sm sm:text-base" : "text-sm",
            )}
          />
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
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="lx-glass absolute left-0 right-0 top-[calc(100%+10px)] z-[70] overflow-hidden rounded-2xl bg-[#0a0c1a]/95 p-2 shadow-2xl shadow-black/60"
          >
            {loading && hits.length === 0 ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Shimmer className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Shimmer className="h-3 w-2/3" />
                      <Shimmer className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hits.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--lx-muted)]">
                No matches — try another keyword.
              </p>
            ) : (
              <ul role="listbox" aria-label="Search results">
                {hits.map((hit, index) => (
                  <li key={hit.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(`/products/${hit.slug}`)}
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
            <button
              type="button"
              onClick={submit}
              className="mt-1 flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-[var(--lx-cyan)] transition hover:bg-white/5"
            >
              View all results for “{query.trim()}”
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

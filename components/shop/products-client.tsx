"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  PackageSearch,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import {
  EmptyState,
  PageHeader,
  ProductGridSkeleton,
  Skeleton,
} from "@/components/shop/storefront-ui";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

const PAGE_SIZE = 24;

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price · low to high" },
  { value: "price-desc", label: "Price · high to low" },
] as const;

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ProductsContent({ products, brands }: { products: Product[]; brands: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const categoryParam = sp.get("category") ?? "";
  const subCategoryParam = sp.get("subcategory") ?? "";
  const brandParam = sp.get("brand") ?? "";
  const sortParam = sp.get("sort") ?? "";

  const [query, setQuery] = useState(q);
  const [category, setCategory] = useState(categoryParam);
  const [sub, setSub] = useState(subCategoryParam);
  const [brand, setBrand] = useState(
    () => brands.find((item) => slugify(item) === brandParam) ?? "",
  );
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<string>(
    () => SORTS.find((option) => option.value === sortParam)?.value ?? "newest",
  );
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => map.set(product.categorySlug, product.categoryName));
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [products]);

  const subCategories = useMemo(() => {
    const map = new Map<string, string>();
    products
      .filter((product) => !category || product.categorySlug === category)
      .forEach((product) => {
        if (product.subCategorySlug) map.set(product.subCategorySlug, product.subCategoryName);
      });
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [products, category]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => product.colors.forEach((value) => value && set.add(value)));
    return [...set].sort((a, b) => a.localeCompare(b)).slice(0, 20);
  }, [products]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => product.sizes.forEach((value) => value && set.add(value)));
    return [...set].sort((a, b) => {
      const ai = SIZE_ORDER.indexOf(a);
      const bi = SIZE_ORDER.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = [...products];
    if (term) {
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.brandName.toLowerCase().includes(term) ||
          product.categoryName.toLowerCase().includes(term) ||
          product.subCategoryName.toLowerCase().includes(term),
      );
    }
    if (category) {
      list = list.filter(
        (product) =>
          product.categorySlug === category ||
          product.categoryName.toLowerCase() === category.toLowerCase(),
      );
    }
    if (sub) list = list.filter((product) => product.subCategorySlug === sub);
    if (brand) list = list.filter((product) => product.brandName === brand);
    if (color) list = list.filter((product) => product.colors.includes(color));
    if (size) list = list.filter((product) => product.sizes.includes(size));
    if (minPrice) list = list.filter((product) => product.finalPrice >= Number(minPrice));
    if (maxPrice) list = list.filter((product) => product.finalPrice <= Number(maxPrice));
    if (rating) list = list.filter((product) => product.rating >= Number(rating));
    if (inStock) list = list.filter((product) => product.stock > 0);

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      case "popular":
        list = [...list].sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      default:
        list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return list;
  }, [products, query, category, sub, brand, color, size, minPrice, maxPrice, rating, inStock, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilters = [
    query ? { key: "query", label: `“${query}”`, clear: () => setQuery("") } : null,
    category
      ? {
          key: "category",
          label: categories.find((item) => item.value === category)?.label ?? category,
          clear: () => {
            setCategory("");
            setSub("");
          },
        }
      : null,
    sub
      ? {
          key: "sub",
          label: subCategories.find((item) => item.value === sub)?.label ?? sub,
          clear: () => setSub(""),
        }
      : null,
    brand ? { key: "brand", label: brand, clear: () => setBrand("") } : null,
    color ? { key: "color", label: color, clear: () => setColor("") } : null,
    size ? { key: "size", label: `Size ${size}`, clear: () => setSize("") } : null,
    minPrice ? { key: "min", label: `From $${minPrice}`, clear: () => setMinPrice("") } : null,
    maxPrice ? { key: "max", label: `Up to $${maxPrice}`, clear: () => setMaxPrice("") } : null,
    rating ? { key: "rating", label: `${rating}★ & up`, clear: () => setRating("") } : null,
    inStock ? { key: "stock", label: "In stock", clear: () => setInStock(false) } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const resetAll = () => {
    setQuery("");
    setCategory("");
    setSub("");
    setBrand("");
    setColor("");
    setSize("");
    setMinPrice("");
    setMaxPrice("");
    setRating("");
    setInStock(false);
    setPage(1);
    router.replace("/products", { scroll: false });
  };

  const update = <T,>(setter: (value: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  const filterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
          Refine the edit
        </p>
        {activeFilters.length ? (
          <Button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--lx-gold)] transition hover:text-[var(--lx-text)]"
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> Reset
          </Button>
        ) : null}
      </div>

      <div>
        <label htmlFor="filter-category" className="lx-label">
          Collection
        </label>
        <div className="relative">
          <select
            id="filter-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSub("");
              setPage(1);
            }}
            className="lx-field appearance-none pr-9"
          >
            <option value="">All collections</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
            aria-hidden
          />
        </div>
      </div>

      {subCategories.length ? (
        <div>
          <label htmlFor="filter-subcategory" className="lx-label">
            Category
          </label>
          <div className="relative">
            <select
              id="filter-subcategory"
              value={sub}
              onChange={(event) => update(setSub, event.target.value)}
              className="lx-field appearance-none pr-9"
            >
              <option value="">All categories</option>
              {subCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
              aria-hidden
            />
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor="filter-brand" className="lx-label">
          Maison
        </label>
        <div className="relative">
          <select
            id="filter-brand"
            value={brand}
            onChange={(event) => update(setBrand, event.target.value)}
            className="lx-field appearance-none pr-9"
          >
            <option value="">All maisons</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
            aria-hidden
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="filter-color" className="lx-label">
            Colour
          </label>
          <div className="relative">
            <select
              id="filter-color"
              value={color}
              onChange={(event) => update(setColor, event.target.value)}
              className="lx-field appearance-none pr-8"
            >
              <option value="">All</option>
              {colors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--lx-muted)]"
              aria-hidden
            />
          </div>
        </div>
        <div>
          <label htmlFor="filter-size" className="lx-label">
            Size
          </label>
          <div className="relative">
            <select
              id="filter-size"
              value={size}
              onChange={(event) => update(setSize, event.target.value)}
              className="lx-field appearance-none pr-8"
            >
              <option value="">All</option>
              {sizes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--lx-muted)]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div>
        <p className="lx-label">Price range</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(event) => update(setMinPrice, event.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="lx-field"
          />
          <span className="text-[var(--lx-faint)]">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(event) => update(setMaxPrice, event.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="lx-field"
          />
        </div>
      </div>

      <div>
        <p className="lx-label">Rating</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "", label: "Any" },
            { value: "4", label: "4★ & up" },
            { value: "3", label: "3★ & up" },
          ].map((option) => (
            <Button
              key={option.value || "any"}
              type="button"
              onClick={() => update(setRating, option.value)}
              className={cn("lx-chip", rating === option.value && "lx-chip-active")}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={() => update(setInStock, !inStock)}
        aria-pressed={inStock}
        className="flex w-full items-center justify-between rounded-xl border border-[var(--lx-border)] px-3.5 py-3 text-left text-xs text-[var(--lx-muted)] transition hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]"
      >
        In stock only
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border transition",
            inStock
              ? "border-[var(--lx-gold)] bg-[var(--lx-gold)] text-[#0B0B0F]"
              : "border-[var(--lx-border-strong)]",
          )}
        >
          {inStock ? <Check className="h-3 w-3" aria-hidden /> : null}
        </span>
      </Button>
    </div>
  );

  return (
    <div className="lx-page">
      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <PageHeader
          eyebrow="The live catalogue"
          title={
            <>
              The <span className="lx-serif text-[var(--lx-gold)]">collection</span>
            </>
          }
          description="Every piece is pulled from live inventory — filter by maison, colour, size or price, then add to your bag in one gesture."
          aside={
            <div className="lx-glass flex items-center gap-5 rounded-2xl px-5 py-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                  In this edit
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--lx-text)]">
                  {filtered.length}
                </p>
              </div>
              <span className="h-10 w-px bg-[var(--lx-border)]" aria-hidden />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                  Atelier stock
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--lx-emerald)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> Live
                </p>
              </div>
            </div>
          }
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[16.5rem_1fr]">
          <aside className="hidden lg:block">
            <div className="lx-card sticky top-28 rounded-2xl p-5">{filterPanel}</div>
          </aside>

          <div>
            <div className="lx-glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Search the collection</span>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(event) => update(setQuery, event.target.value)}
                  placeholder="Search this collection…"
                  className="lx-field h-11 border-transparent bg-transparent focus:bg-transparent"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => setDrawer(true)}
                  className="lx-field !w-auto flex h-11 shrink-0 items-center gap-2 whitespace-nowrap px-4 text-xs lg:hidden"
                  aria-expanded={drawer}
                  aria-controls="mobile-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filters
                  {activeFilters.length ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--lx-gold)] px-1 text-[10px] font-bold text-[#0B0B0F]">
                      {activeFilters.length}
                    </span>
                  ) : null}
                </Button>

                <div className="relative min-w-0 flex-1 sm:w-52 sm:flex-none">
                  <label htmlFor="sort" className="sr-only">
                    Sort products
                  </label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                    className="lx-field h-11 w-full min-w-0 appearance-none pr-9 text-xs"
                  >
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lx-muted)]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>

            {activeFilters.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--lx-muted)]">
                  Filtered by
                </span>
                {activeFilters.map((filter) => (
                  <Button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      filter.clear();
                      setPage(1);
                    }}
                    className="lx-chip lx-chip-active"
                  >
                    {filter.label}
                    <X className="h-3 w-3" aria-hidden />
                  </Button>
                ))}
                <Button
                  type="button"
                  onClick={resetAll}
                  className="text-[11px] text-[var(--lx-muted)] underline-offset-4 transition hover:text-[var(--lx-text)] hover:underline"
                >
                  Clear all
                </Button>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)]">
                Showing {pageItems.length} of {filtered.length} pieces
              </p>
              <p className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--lx-muted)] sm:block">
                Page {currentPage} / {totalPages}
              </p>
            </div>

            {pageItems.length ? (
              <motion.div layout className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {pageItems.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.16), ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={PackageSearch}
                  eyebrow="No pieces match"
                  title="The edit is empty — for now."
                  description="Try removing a filter, widening the price range, or searching a different maison."
                >
                  <Button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--lx-text)] px-6 text-sm font-semibold text-[var(--lx-bg)] transition hover:-translate-y-0.5"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Reset filters
                  </Button>
                  <Link
                    href="/categories"
                    className="lx-glass inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium text-[var(--lx-text)]"
                  >
                    Browse collections <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </EmptyState>
              </div>
            )}

            {totalPages > 1 ? (
              <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                  className="lx-chip disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const number = index + 1;
                  if (
                    totalPages > 7 &&
                    number !== 1 &&
                    number !== totalPages &&
                    Math.abs(number - currentPage) > 1
                  ) {
                    return null;
                  }
                  return (
                    <Button
                      key={number}
                      type="button"
                      onClick={() => setPage(number)}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={cn(
                        "flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs transition",
                        number === currentPage
                          ? "border-[var(--lx-gold)] bg-[var(--lx-gold)] font-semibold text-[#0B0B0F]"
                          : "border-[var(--lx-border)] text-[var(--lx-muted)] hover:border-[var(--lx-border-strong)] hover:text-[var(--lx-text)]",
                      )}
                    >
                      {number}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage >= totalPages}
                  className="lx-chip disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </div>
        </div>
      </div>

      {/* mobile filter drawer */}
      <AnimatePresence>
        {drawer ? (
          <motion.div
            className="fixed inset-0 z-[120] flex lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
          >
            <Button
              type="button"
              aria-label="Close filters"
              onClick={() => setDrawer(false)}
              className="absolute inset-0 bg-[#02030a]/60 backdrop-blur-sm"
            />
            <motion.div
              id="mobile-filters"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-full w-[min(22rem,88vw)] flex-col bg-[var(--lx-bg)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--lx-border)] px-5 py-4">
                <p className="text-sm font-semibold text-[var(--lx-text)]">Filters</p>
                <Button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Close filters"
                  className="lx-icon-button"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{filterPanel}</div>
              <div className="border-t border-[var(--lx-border)] p-4">
                <Button
                  type="button"
                  onClick={() => setDrawer(false)}
                  className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--lx-text)] text-sm font-semibold text-[var(--lx-bg)] transition hover:-translate-y-0.5"
                >
                  Show {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProductsFallback() {
  return (
    <div className="lx-page">
      <div className="lx-container py-16">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-6 h-14 w-3/4 max-w-2xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[16.5rem_1fr]">
          <Skeleton className="hidden h-[34rem] rounded-2xl lg:block" />
          <ProductGridSkeleton count={8} className="lg:grid-cols-3" />
        </div>
      </div>
    </div>
  );
}

export function ProductsClient({ products, brands }: { products: Product[]; brands: string[] }) {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsContent products={products} brands={brands} />
    </Suspense>
  );
}

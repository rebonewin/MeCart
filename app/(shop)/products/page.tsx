"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { products } from "@/lib/mock-data";
import type { Product } from "@/types/product";

const PAGE_SIZE = 24;

function ProductsContent() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").toLowerCase();
  const category = sp.get("category") ?? "";
  const subCategory = sp.get("subcategory") ?? "";

  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = products as Product[];
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q) || p.subCategoryName.toLowerCase().includes(q),
      );
    }
    if (category) list = list.filter((p) => p.categorySlug === category || p.categoryName.toLowerCase() === category);
    if (subCategory) list = list.filter((p) => p.subCategorySlug === subCategory);
    if (brand) list = list.filter((p) => p.brandName === brand);
    if (color) list = list.filter((p) => p.colors.includes(color));
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (minPrice) list = list.filter((p) => p.finalPrice >= Number(minPrice));
    if (maxPrice) list = list.filter((p) => p.finalPrice <= Number(maxPrice));
    if (rating) list = list.filter((p) => p.rating >= Number(rating));

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
  }, [q, category, subCategory, brand, color, size, minPrice, maxPrice, rating, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const brands = [...new Set(products.map((p) => p.brandName))].sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row">
        <aside className="w-full md:w-64">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Filters</h2>
            <div className="mt-4 space-y-3 text-sm">
              <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className="w-full rounded border px-2 py-1.5 dark:bg-gray-800">
                <option value="">All Brands</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={color} onChange={(e) => { setColor(e.target.value); setPage(1); }} className="w-full rounded border px-2 py-1.5 dark:bg-gray-800">
                <option value="">All Colors</option>
                {["Black","White","Blue","Red","Green","Brown","Grey","Pink"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={size} onChange={(e) => { setSize(e.target.value); setPage(1); }} className="w-full rounded border px-2 py-1.5 dark:bg-gray-800">
                <option value="">All Sizes</option>
                {["XS","S","M","L","XL","XXL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 rounded border px-2 py-1.5 dark:bg-gray-800" />
                <input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 rounded border px-2 py-1.5 dark:bg-gray-800" />
              </div>
              <select value={rating} onChange={(e) => { setRating(e.target.value); setPage(1); }} className="w-full rounded border px-2 py-1.5 dark:bg-gray-800">
                <option value="">Any Rating</option>
                <option value="4">4★ & up</option>
                <option value="3">3★ & up</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">{filtered.length} products</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border px-2 py-1.5 text-sm dark:bg-gray-800">
              <option value="newest">Newest</option>
              <option value="popular">Popularity</option>
              <option value="rating">Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {pageItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              Prev
            </button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() { return <Suspense fallback={<div className="p-8">Loading...</div>}><ProductsContent /></Suspense>; }

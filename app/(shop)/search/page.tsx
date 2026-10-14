"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { products as all } from "@/lib/mock-data";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? all.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.brandName.toLowerCase().includes(query.toLowerCase()) || p.subCategoryName.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands, categories..."
        className="mt-4 w-full rounded-xl border px-4 py-2.5 dark:bg-gray-800"
      />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {results.slice(0, 48).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {query.trim() && results.length === 0 && <p className="mt-8 text-center text-gray-500">No results found.</p>}
    </div>
  );
}

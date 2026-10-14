"use client";

import Link from "next/link";
import { categories, subCategories } from "@/lib/mock-data";

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Categories</h1>
      <div className="mt-6 grid gap-6">
        {categories.map((cat) => (
          <div key={cat.id}>
            <h2 className="text-xl font-semibold text-indigo-600">{cat.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {subCategories
                .filter((s) => s.categorySlug === cat.slug)
                .map((s) => (
                  <Link
                    key={s.id}
                    href={`/products?category=${cat.slug}&subcategory=${s.slug}`}
                    className="rounded-xl border border-gray-200 bg-white p-3 text-center text-sm hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900"
                  >
                    {s.name}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

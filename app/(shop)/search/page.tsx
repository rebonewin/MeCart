import { ProductCard } from "@/components/shop/product-card";
import { listProducts } from "@/lib/repositories/products";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await listProducts({ search: query, limit: 60 }) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Search</h1>
      <form action="/search" method="GET" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search products, brands, categories..."
          className="w-full rounded-xl border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
        <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 text-white">
          Search
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm text-gray-500">
          {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {!query && <p className="mt-10 text-gray-500">Type a query to search the catalog.</p>}
    </div>
  );
}

import Link from "next/link";

const categories = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Books"];
const featured = [
  { id: 1, name: "Wireless Headphones", price: 129.0, image: "" },
  { id: 2, name: "Smart Watch", price: 199.0, image: "" },
  { id: 3, name: "Running Shoes", price: 89.0, image: "" },
  { id: 4, name: "Mechanical Keyboard", price: 149.0, image: "" },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 p-10 text-white">
          <h1 className="text-4xl font-bold md:text-5xl">Welcome to MeCart</h1>
          <p className="mt-4 max-w-2xl text-indigo-100">
            Enterprise-grade eCommerce platform with secure checkout, fast delivery, and curated products.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/products" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-gray-100">
              Shop Now
            </Link>
            <Link href="/categories" className="rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="text-2xl font-semibold">Categories</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/categories/${c.toLowerCase()}`}
              className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-800 dark:bg-gray-900"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Products</h2>
          <Link href="/products" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
          {featured.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800" />
              <h3 className="mt-3 text-sm font-medium">{p.name}</h3>
              <p className="mt-1 text-sm font-semibold text-indigo-600">${p.price.toFixed(2)}</p>
              <button type="button" className="mt-3 w-full rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

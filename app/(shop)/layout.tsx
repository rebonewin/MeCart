import Link from "next/link";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            MeCart
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/products" className="hover:text-indigo-600">Products</Link>
            <Link href="/categories" className="hover:text-indigo-600">Categories</Link>
            <Link href="/search" className="hover:text-indigo-600">Search</Link>
            <Link href="/cart" className="hover:text-indigo-600">Cart</Link>
            <Link href="/login" className="rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700">
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-500">
          © 2026 MeCart. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

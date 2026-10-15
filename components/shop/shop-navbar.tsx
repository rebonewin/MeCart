"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

export function ShopNavbar() {
  const { data: session } = useSession();
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("mecart_theme");
    const enabled = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mecart_theme", next ? "dark" : "light");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/75 backdrop-blur-xl dark:border-gray-800/70 dark:bg-gray-950/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition group-hover:scale-105">
            M
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:inline">MeCart</span>
        </Link>

        <form action="/search" className="mx-2 hidden flex-1 items-center gap-2 md:flex">
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="h-10 w-full rounded-full border border-gray-200 bg-white/80 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900/80"
          />
          <button className="h-10 rounded-full bg-gradient-to-r from-slate-900 to-blue-600 px-5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
            Search
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link href="/categories" className="hidden rounded-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:inline-flex">
            Categories
          </Link>
          <Link href="/wishlist" className="relative rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Wishlist">
            <span className="text-lg">♥</span>
            {wishlistItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cart">
            <span className="text-lg">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {session?.user ? (
            <>
              {(session.user as { role?: string }).role === "ADMIN" && (
                <Link href="/admin" className="hidden rounded-full bg-slate-900 px-4 py-2 text-white transition hover:-translate-y-0.5 sm:inline-flex">
                  Admin
                </Link>
              )}
              <Link href="/profile" className="hidden rounded-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 sm:inline-flex">
                {session.user.name || session.user.username || "Profile"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                Login
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-md transition hover:-translate-y-0.5 sm:inline-flex"
              >
                Register
              </Link>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {dark ? "🌙" : "☀️"}
          </button>
        </nav>
      </div>
    </header>
  );
}

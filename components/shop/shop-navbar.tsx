"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { LiveSearch } from "@/components/storefront/live-search";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Collections", href: "/categories" },
  { label: "Deals", href: "/#flash-deals" },
  { label: "About", href: "/about" },
];

function readThemeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )mecart-theme=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function Badge({ count, tone }: { count: number; tone: "gold" | "cyan" }) {
  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className={cn(
            "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
            tone === "gold" ? "bg-[var(--lx-gold)] text-[#241a05]" : "bg-[var(--lx-cyan)] text-[#04202a]",
          )}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

export function ShopNavbar() {
  const { user, signOut } = useAuth();
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [dark, setDark] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readThemeCookie();
    const enabled =
      stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", enabled);
    const timer = window.setTimeout(() => setDark(enabled), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mecart-theme", next ? "dark" : "light");
    document.cookie = `mecart-theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };

  const authed = Boolean(user && !user.isAnonymous);
  const isStaff = user?.role === "admin" || user?.role === "manager";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/[0.08] bg-[#05060e]/70 backdrop-blur-2xl transition-all duration-500",
        scrolled ? "shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]" : "",
      )}
    >
      <div className="lx-hairline-x pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-40" />
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-3 px-4 transition-all duration-500 sm:px-6 lg:px-8",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MeCart home">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="lx-conic-ring absolute inset-0 rounded-xl opacity-90 transition group-hover:opacity-100" />
            <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[10px] bg-[#05060e] text-sm font-black text-white">
              M
            </span>
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-base font-bold tracking-tight text-white">MeCart</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.32em] text-[var(--lx-muted)]">
              Atelier
            </span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mx-auto hidden w-full max-w-md md:block lg:max-w-sm xl:max-w-md">
          <LiveSearch size="sm" placeholder="Search the atelier…" />
        </div>

        <nav className="ml-auto flex items-center gap-1.5" aria-label="Account">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            {dark ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
          </button>

          <Link
            href="/wishlist"
            aria-label={`Wishlist (${wishlistItems.length})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <Heart className="h-4 w-4" aria-hidden />
            <Badge count={wishlistItems.length} tone="gold" />
          </Link>

          <Link
            href="/cart"
            aria-label={`Cart (${cartCount})`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <Badge count={cartCount} tone="cyan" />
          </Link>

          {authed ? (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2 rounded-full border border-white/10 pl-1.5 pr-3 transition hover:border-white/25"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--lx-iris)] to-[var(--lx-cyan)] text-[11px] font-bold text-white">
                  {(user?.name || user?.username || "U")[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-[7rem] truncate text-xs font-medium text-white sm:block">
                  {user?.name || user?.username || "Account"}
                </span>
              </button>
              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    role="menu"
                    className="lx-glass absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-2xl bg-[#0a0c1a]/95 p-1.5 shadow-2xl shadow-black/60"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <User className="h-4 w-4" aria-hidden /> Profile
                    </Link>
                    <Link
                      href="/orders"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <Package className="h-4 w-4" aria-hidden /> Orders
                    </Link>
                    {isStaff ? (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        <LayoutDashboard className="h-4 w-4" aria-hidden /> Admin dashboard
                      </Link>
                    ) : null}
                    <div className="mx-2 my-1 h-px bg-white/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAccountOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300/90 transition hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <LogOut className="h-4 w-4" aria-hidden /> Sign out
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-10 items-center rounded-full bg-gradient-to-r from-[var(--lx-iris)] to-[var(--lx-cyan)] px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Create account
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/5 hover:text-white lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.08] bg-[#05060e]/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="space-y-3 px-4 py-4 sm:px-6">
              <LiveSearch size="sm" placeholder="Search the atelier…" onNavigate={() => setMenuOpen(false)} />
              <div className="grid grid-cols-2 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="lx-glass rounded-xl px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              {!authed ? (
                <div className="flex gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="lx-glass flex h-11 flex-1 items-center justify-center rounded-full text-sm font-medium text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex h-11 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[var(--lx-iris)] to-[var(--lx-cyan)] text-sm font-semibold text-white"
                  >
                    Create account
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

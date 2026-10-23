"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Award,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Search,
  ShoppingBag,
  Sun,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useRider } from "@/components/storefront/rider/rider-provider";
import { RiderMascot } from "@/components/storefront/rider/rider-mascot";
import { LiveSearch } from "@/components/storefront/live-search";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Products", href: "/products" },
  { label: "Stores", href: "/stores" },
  { label: "Collections", href: "/categories" },
  { label: "Deals", href: "/#flash-deals" },
  { label: "Rewards", href: "/rewards" },
  { label: "About", href: "/about" },
];

const QUICK_LINKS = [
  { label: "New in", href: "/products?sort=newest" },
  { label: "Marketplace stores", href: "/stores" },
  { label: "Collections", href: "/categories" },
  { label: "Flash deals", href: "/#flash-deals" },
  { label: "Wishlist", href: "/wishlist" },
];

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
            "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold shadow-lg shadow-black/30",
            tone === "gold"
              ? "bg-[var(--lx-gold)] text-[#241a05]"
              : "bg-[var(--lx-cyan)] text-[#04202a]",
          )}
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function IconButton({
  label,
  onClick,
  expanded,
  children,
  className,
  buttonRef,
}: {
  label: string;
  onClick: () => void;
  expanded?: boolean;
  children: React.ReactNode;
  className?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition duration-300 hover:bg-white/[0.06] hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

function readThemeCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )mecart-theme=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function ShopNavbar() {
  const { user, signOut } = useAuth();
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { pulse } = useRider();
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartHover, setCartHover] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = readThemeCookie();
    const enabled =
      stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", enabled);
    const frame = window.requestAnimationFrame(() => {
      setDark(enabled);
      setScrolled(window.scrollY > 12);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
        setAccountOpen(false);
      }
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [searchOpen, menuOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    window.setTimeout(() => searchButtonRef.current?.focus(), 80);
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mecart-theme", next ? "dark" : "light");
    document.cookie = `mecart-theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };

  const authed = Boolean(user && !user.isAnonymous);
  const isStaff = user?.role === "admin" || user?.role === "manager";
  const displayName = user?.name || user?.username || "Account";

  return (
    <header className="lx-dark-scene sticky top-0 z-50">
      {/* atelier service strip */}
      <div className="hidden border-b border-white/[0.06] bg-[#04050c] lg:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-8 font-mono text-[9px] uppercase tracking-[0.24em] text-white/42">
          <span>Considered objects · live inventory</span>
          <span className="flex items-center gap-2 text-white/60">
            <span className="h-1 w-1 rounded-full bg-[var(--lx-emerald)]" />
            SS26 Atelier drop is live
            <Link href="/products" className="text-[var(--lx-gold)] transition hover:text-white">
              Explore
            </Link>
          </span>
          <span>7-day returns · Secure checkout</span>
        </div>
      </div>

      <div
        className={cn(
          "relative border-b border-white/[0.08] bg-[#05060e]/72 backdrop-blur-2xl transition-all duration-500",
          scrolled
            ? "bg-[#05060e]/90 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.95)]"
            : "shadow-none",
        )}
      >
        <div className="lx-hairline-x pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-35" />
        <div
          className={cn(
            "relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-all duration-500 sm:px-6 lg:px-8",
            scrolled ? "h-16" : "h-[4.5rem]",
          )}
        >
          {/* left — primary nav + mobile menu trigger */}
          <div className="flex flex-1 items-center gap-1">
            <IconButton
              label={menuOpen ? "Close menu" : "Open menu"}
              expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="xl:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </IconButton>

            <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group relative rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/62 transition hover:text-white"
                >
                  {link.label}
                  <span className="absolute inset-x-3.5 -bottom-0.5 h-px scale-x-0 bg-[var(--lx-gold)] transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              ))}
            </nav>
          </div>

          {/* centre — MECART wordmark */}
          <Link
            href="/"
            aria-label="MeCart home"
            className="group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3"
          >
            <span className="relative flex h-10 w-10 items-center justify-center">
              <span className="lx-conic-ring absolute inset-0 rounded-[13px] opacity-80 transition duration-500 group-hover:opacity-100 group-hover:rotate-180" />
              <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[11px] bg-[#05060e] text-base font-black text-white">
                M
              </span>
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[17px] font-semibold tracking-[0.22em] text-white">MECART</span>
              <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.46em] text-[var(--lx-muted)]">
                Maison · Atelier
              </span>
            </span>
          </Link>

          {/* right — actions */}
          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
            <IconButton
              label="Search (Command K)"
              expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex"
              buttonRef={searchButtonRef}
            >
              <Search className="h-4 w-4" aria-hidden />
            </IconButton>

            <IconButton label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme}>
              {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
            </IconButton>

            <Link
              href="/wishlist"
              aria-label={`Wishlist (${wishlistItems.length})`}
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-white/65 transition duration-300 hover:bg-white/[0.06] hover:text-white sm:flex"
            >
              <Heart className="h-4 w-4" aria-hidden />
              <Badge count={wishlistItems.length} tone="gold" />
            </Link>

            {/* rider + cart */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setCartHover(true)}
              onMouseLeave={() => setCartHover(false)}
            >
              <RiderMascot cartHovered={cartHover} className="mr-0.5 inline-flex" />
              <Link
                id="mecart-cart-anchor"
                href="/cart"
                aria-label={`Cart (${cartCount})`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-white/65 transition duration-300 hover:bg-white/[0.06] hover:text-white"
              >
                <motion.span
                  animate={cartHover ? { scale: 1.12, rotate: -6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  className="flex"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                </motion.span>
                <Badge count={cartCount} tone="cyan" />
                <AnimatePresence>
                  {pulse > 0 ? (
                    <motion.span
                      key={pulse}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-[var(--lx-cyan)]"
                      initial={{ opacity: 0.9, scale: 0.55 }}
                      animate={{ opacity: 0, scale: 1.9 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  ) : null}
                </AnimatePresence>
              </Link>
            </div>

            {authed ? (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  className="ml-1 flex h-10 items-center gap-2 rounded-full border border-white/10 pl-1.5 pr-3 transition duration-300 hover:border-white/25 hover:bg-white/[0.04]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--lx-iris)] to-[var(--lx-cyan)] text-[11px] font-bold text-white shadow-lg shadow-indigo-500/20">
                    {displayName[0]?.toUpperCase()}
                  </span>
                  <span className="hidden max-w-[7rem] truncate text-[11px] font-medium text-white 2xl:block">
                    {displayName}
                  </span>
                </button>

                <AnimatePresence>
                  {accountOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      role="menu"
                      aria-label="Account"
                      className="lx-glass absolute right-0 top-[calc(100%+12px)] w-64 overflow-hidden rounded-2xl bg-[#0a0c1a]/97 p-1.5 shadow-2xl shadow-black/60"
                    >
                      <div className="border-b border-white/[0.08] px-3 pb-3 pt-2">
                        <p className="truncate text-sm font-medium text-white">{displayName}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--lx-muted)]">
                          {user?.email || "MeCart member"}
                        </p>
                      </div>
                      <div className="pt-1">
                        <Link
                          href="/profile"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                        >
                          <User className="h-4 w-4" aria-hidden /> Profile
                        </Link>
                        <Link
                          href="/rewards"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                        >
                          <Award className="h-4 w-4" aria-hidden /> Rewards & standing
                        </Link>
                        <Link
                          href="/orders"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                        >
                          <Package className="h-4 w-4" aria-hidden /> Orders
                        </Link>
                        <Link
                          href="/messages"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                        >
                          <MessageCircle className="h-4 w-4" aria-hidden /> Messages
                        </Link>
                        {isStaff ? (
                          <Link
                            href="/admin"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/[0.07] hover:text-white"
                          >
                            <LayoutDashboard className="h-4 w-4" aria-hidden /> Admin dashboard
                          </Link>
                        ) : null}
                      </div>
                      <div className="mx-2 my-1 h-px bg-white/10" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false);
                          void signOut();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--lx-rose)] transition hover:bg-[var(--lx-rose)]/10"
                      >
                        <LogOut className="h-4 w-4" aria-hidden /> Sign out
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 xl:flex">
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/65 transition hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="flex h-10 items-center whitespace-nowrap rounded-full bg-gradient-to-r from-[#f5d08a] via-[#f0c46c] to-[#e0a84e] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#241a05] shadow-[0_14px_40px_-18px_rgba(240,196,108,0.6)] transition duration-300 hover:-translate-y-0.5 hover:brightness-105"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* command-palette search */}
      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[90] overflow-y-auto bg-[#04050c]/84 backdrop-blur-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Search MeCart"
          >
            <button
              type="button"
              aria-label="Close search"
              onClick={closeSearch}
              className="absolute inset-0 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-[14vh] sm:px-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
                    Find your next object
                  </p>
                  <p className="mt-1 text-sm text-[var(--lx-muted)]">
                    Search the live catalogue, brands and collections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <LiveSearch size="lg" autoFocus inline onNavigate={closeSearch} />

              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeSearch}
                    className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs text-white/70 transition hover:border-[var(--lx-gold)]/35 hover:bg-white/[0.05] hover:text-white"
                  >
                    {link.label}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 text-white/30 transition group-hover:text-[var(--lx-gold)]"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>

              <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                Press Esc to close · ⌘K / Ctrl K to reopen
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* mobile menu */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 top-[4.5rem] z-[85] overflow-y-auto border-t border-white/[0.08] bg-[#05060e]/97 backdrop-blur-2xl xl:hidden"
          >
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
              <LiveSearch size="lg" placeholder="Search the atelier…" onNavigate={() => setMenuOpen(false)} />
              <nav aria-label="Mobile primary" className="mt-6 grid gap-2">
                {NAV_LINKS.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.07] px-5 py-4 text-lg font-medium text-white/85 transition hover:border-white/20 hover:bg-white/[0.04]"
                    >
                      {link.label}
                      <ArrowUpRight className="h-4 w-4 text-white/30" aria-hidden />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Link
                  href="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="lx-glass flex h-12 items-center justify-center gap-2 rounded-full text-sm text-white"
                >
                  <Heart className="h-4 w-4" aria-hidden /> Wishlist
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="lx-glass flex h-12 items-center justify-center gap-2 rounded-full text-sm text-white"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden /> Bag ({cartCount})
                </Link>
              </div>

              {!authed ? (
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="lx-glass flex h-12 flex-1 items-center justify-center rounded-full text-sm font-medium text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex h-12 flex-1 items-center justify-center rounded-full bg-gradient-to-r from-[#f5d08a] via-[#f0c46c] to-[#e0a84e] text-sm font-semibold text-[#241a05]"
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

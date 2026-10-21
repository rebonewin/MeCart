"use client";

import Link from "next/link";
import { ArrowUp, Mail } from "lucide-react";
import { Magnetic } from "@/components/luxe/primitives";

const SHOP_LINKS = [
  { label: "All products", href: "/products" },
  { label: "Collections", href: "/categories" },
  { label: "Flash deals", href: "/#flash-deals" },
  { label: "Wishlist", href: "/wishlist" },
];

const ACCOUNT_LINKS = [
  { label: "Profile", href: "/profile" },
  { label: "Orders", href: "/orders" },
  { label: "Cart", href: "/cart" },
  { label: "Checkout", href: "/checkout" },
];

const HOUSE_LINKS = [
  { label: "About the atelier", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Search", href: "/search" },
  { label: "Sign in", href: "/login" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="lx-dark-scene relative mt-24 overflow-hidden border-t border-white/[0.08] bg-[#05060e] text-[var(--lx-text)]">
      <div className="lx-hairline-x absolute inset-x-0 top-0 h-px" />
      <div className="lx-blob lx-drift-b left-[-10%] top-[-30%] h-[26rem] w-[26rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25),transparent_65%)]" />
      <div className="lx-blob lx-drift-c right-[-12%] bottom-[-40%] h-[28rem] w-[28rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label="MeCart home">
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="lx-conic-ring absolute inset-0 rounded-[13px] opacity-90" />
                <span className="relative z-10 flex h-[calc(100%-3px)] w-[calc(100%-3px)] items-center justify-center rounded-[11px] bg-[#05060e] text-base font-black text-white">
                  M
                </span>
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[19px] font-semibold tracking-[0.2em] text-white">MECART</span>
                <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.4em] text-[var(--lx-muted)]">
                  Maison · Atelier
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[var(--lx-muted)]">
              A premium commerce atelier — considered objects, live inventory and atelier care on every
              order. Built on a real-time catalogue, not a brochure.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/45">
              <span>Curated in small batches</span>
              <span>Worldwide delivery</span>
              <span>7-day returns</span>
            </div>
            <a
              href="mailto:care@mecart.store"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-cyan)] transition hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden />
              care@mecart.store
            </a>
          </div>

          {[
            { title: "Shop", links: SHOP_LINKS },
            { title: "Account", links: ACCOUNT_LINKS },
            { title: "House", links: HOUSE_LINKS },
          ].map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--lx-muted)]">
                {column.title}
              </p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
                    >
                      <span className="h-px w-0 bg-[var(--lx-gold)] transition-all duration-300 group-hover:w-4" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* watermark */}
        <div
          aria-hidden
          className="pointer-events-none mt-16 select-none text-center text-[18vw] font-black leading-none tracking-tighter text-white/[0.03] lg:text-[11rem]"
        >
          MECART
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-white/[0.08] pt-8 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
            © {year} MeCart Atelier — all rights reserved
          </p>
          <div className="flex items-center gap-2">
            {["VISA", "MC", "AMEX", "PAYPAL"].map((method) => (
              <span
                key={method}
                className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[9px] tracking-[0.14em] text-white/45"
              >
                {method}
              </span>
            ))}
          </div>
          <Magnetic strength={0.3}>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              className="lx-glass flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:-translate-y-1 hover:bg-white/10 hover:text-white"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}

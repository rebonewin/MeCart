"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/cn";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/seller", label: "Dashboard", icon: LayoutDashboard },
      { href: "/seller/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/seller/products", label: "Products", icon: ShoppingBag },
      { href: "/seller/inventory", label: "Inventory", icon: Boxes },
      { href: "/seller/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/seller/orders", label: "Orders", icon: Package },
      { href: "/seller/returns", label: "Returns", icon: RotateCcw },
      { href: "/seller/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/seller/reviews", label: "Reviews", icon: Star },
      { href: "/seller/messages", label: "Messages", icon: MessageSquare },
      { href: "/seller/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/seller/finance", label: "Finance", icon: Receipt },
      { href: "/seller/payouts", label: "Payouts", icon: CreditCard },
      { href: "/seller/shipping", label: "Shipping", icon: Truck },
      { href: "/seller/stores", label: "Stores", icon: Store },
      { href: "/seller/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SellerShell({
  children,
  vendorName,
  vendorSlug,
  status,
  username,
}: {
  children: React.ReactNode;
  vendorName: string;
  vendorSlug: string;
  status: string;
  username?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = (href: string) =>
    pathname === href || (href !== "/seller" && pathname.startsWith(`${href}/`));

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const nav = (
    <nav className="space-y-6 overflow-y-auto px-3 pb-8">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {group.title}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    active(item.href)
                      ? "bg-gradient-to-r from-[#d8b45a]/20 to-[#d8b45a]/5 text-[#f5dfa2] shadow-lg shadow-black/20 ring-1 ring-[#d8b45a]/25"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-white/[0.08] bg-[#0a0d15]/95 backdrop-blur-2xl transition-all duration-300 md:block",
          collapsed ? "w-20" : "w-72",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <Link href="/seller" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d8b45a] text-[13px] font-black text-[#1e1708]">
                M
              </span>
              <span className="text-sm font-bold tracking-wide text-white">Seller Atelier</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative h-full w-72 border-r border-white/10 bg-[#0a0d15] p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Seller Atelier</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 p-2 text-slate-300"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className={cn("transition-all duration-300", collapsed ? "md:ml-20" : "md:ml-72")}>
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#07090f]/85 backdrop-blur-2xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-white/10 p-2 text-slate-300 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#d8b45a]">Vendor workspace</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-white">{vendorName}</h1>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                      status === "APPROVED"
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                        : status === "SUSPENDED" || status === "REJECTED"
                          ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
                          : "border-amber-400/25 bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {vendorSlug && (
                <Link
                  href={`/vendors/${vendorSlug}`}
                  className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-[#d8b45a]/40 hover:text-white sm:flex"
                >
                  View storefront <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:text-white"
                aria-label="Back to MeCart"
              >
                <Home className="h-4 w-4" />
              </Link>
              <Link
                href="/seller/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:text-white"
                aria-label="Seller notifications"
              >
                <Bell className="h-4 w-4" />
              </Link>
              <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 sm:block">
                {username || "Seller"}
              </div>
              <button
                onClick={() => void handleSignOut()}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:text-white"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

import { CommandPalette } from "@/components/admin/command-palette";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Brain,
  Box,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  MailCheck,
  Smartphone,  Package,
  Palette,
  Receipt,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tags,
  Users,
  ShieldCheck,
} from "lucide-react";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/ai-insights", label: "AI Insights", icon: Brain },
      { href: "/admin/cms", label: "CMS Builder", icon: LayoutTemplate },
      { href: "/admin/media", label: "Media Library", icon: ImageIcon },
      { href: "/admin/theme", label: "Theme Customizer", icon: Palette },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/reports", label: "Reports", icon: ClipboardList },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/marketplace", label: "Marketplace Overview", icon: Store },
      { href: "/admin/marketplace/vendors", label: "Vendors", icon: Users },
      { href: "/admin/marketplace/products", label: "Product Review", icon: ShoppingBag },
      { href: "/admin/marketplace/stores", label: "Stores", icon: Store },
      { href: "/admin/marketplace/ownership", label: "Product Ownership", icon: Package },
      { href: "/admin/marketplace/payouts", label: "Payouts", icon: CreditCard },
      { href: "/admin/marketplace/returns", label: "Returns", icon: Receipt },
      { href: "/admin/marketplace/commissions", label: "Commissions", icon: BarChart3 },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/products", label: "Products", icon: ShoppingBag },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/brands", label: "Brands", icon: Store },
      { href: "/admin/inventory", label: "Inventory", icon: Box },
      { href: "/admin/coupons", label: "Coupons", icon: Receipt },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: Package },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/users/email-verification", label: "Email Verification", icon: MailCheck },
      { href: "/admin/users/phone-verification", label: "Phone Verification", icon: Smartphone },
      { href: "/admin/security", label: "Security", icon: Shield },
      { href: "/admin/security/two-factor", label: "2FA Dashboard", icon: ShieldCheck },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/profile", label: "Profile", icon: Home },
    ],
  },
];

export function AdminShell({ children, username }: { children: React.ReactNode; username?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )mecart-theme=([^;]*)/);
    const stored = match ? decodeURIComponent(match[1]) : localStorage.getItem("mecart-theme");
    const enabled = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const timer = window.setTimeout(() => {
      setDark(enabled);
      document.documentElement.classList.toggle("dark", enabled);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("mecart-theme", next ? "dark" : "light");
    document.cookie = `mecart-theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const active = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

  return (
    <div className="lx-dark-scene min-h-screen bg-[var(--lx-bg)] text-slate-100">
      <aside
        className={`lx-sidebar fixed left-0 top-0 z-40 hidden h-screen border-r border-white/10 backdrop-blur-2xl transition-all duration-300 md:block ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--lx-gold)] text-[12px] font-black text-[#0B0B0F]">
                M
              </span>
              <span className="lx-serif">MeCart Admin</span>
            </span>
          )}
          <Button
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="space-y-6 overflow-y-auto px-3 pb-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group.title}</p>}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      data-active={isActive}
                      className={`lx-sidebar-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-[#D4AF37]/25 to-[#D4AF37]/5 text-[#E6C768] ring-1 ring-[#D4AF37]/25"
                          : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                      }`}
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
      </aside>

      <CommandPalette />

      <div className={`transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-72"}`}>
        <header className="relative isolate sticky top-0 z-30 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[#0B0B0F]" aria-hidden />
          <LiquidStage variant="ambient" intensity={0.42} className="opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/85 to-[#0B0B0F]/35" aria-hidden />
          <div className="relative flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {!collapsed && (
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
                  MeCart Enterprise Admin
                </p>
              )}
              <h1 className="text-xl font-semibold tracking-tight text-white">Operations Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative hidden md:block">
                <span className="sr-only">Search admin</span>
                <input
                  placeholder="Search admin..."
                  className="lx-field h-10 w-72 border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
                />
              </label>
              <Button
                onClick={toggleTheme}
                className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Toggle dark mode"
              >
                {dark ? "🌙" : "☀️"}
              </Button>
              <Button className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white">
                {username || "Admin"}
              </div>
              <Button
                onClick={() => void handleSignOut()}
                className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

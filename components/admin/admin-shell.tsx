"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tags,
  Truck,
  Users,
} from "lucide-react";

const navGroups = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/ai-insights", label: "AI Insights", icon: Brain },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/reports", label: "Reports", icon: ClipboardList },
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
      { href: "/admin/security", label: "Security", icon: Shield },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/profile", label: "Profile", icon: Home },
    ],
  },
];

export function AdminShell({ children, username }: { children: React.ReactNode; username?: string | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mecart_theme");
    const enabled = stored ? stored === "dark" : true;
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
    localStorage.setItem("mecart_theme", next ? "dark" : "light");
  };

  const active = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen border-r border-white/10 bg-slate-950/70 backdrop-blur-2xl transition-all duration-300 md:block ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && <span className="text-lg font-bold text-white">MeCart Admin</span>}
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
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
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600/80 to-cyan-500/60 text-white shadow-lg shadow-blue-600/20"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
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

      <div className={`transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-72"}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 px-4 py-4 backdrop-blur-2xl sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {!collapsed && <p className="text-xs uppercase tracking-[0.3em] text-blue-300">MeCart Enterprise Admin</p>}
              <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="relative hidden md:block">
                <span className="sr-only">Search admin</span>
                <input
                  placeholder="Search admin..."
                  className="h-10 w-72 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
              </label>
              <button
                onClick={toggleTheme}
                className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Toggle dark mode"
              >
                {dark ? "🌙" : "☀️"}
              </button>
              <button className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white">
                {username || "Admin"}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-2xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Home } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

type CommandItem = {
  id: string;
  label: string;
  group: string;
  href: string;
  keywords?: string;
};

const commands: CommandItem[] = [
  { id: "dashboard", label: "Open Dashboard", group: "Navigation", href: "/admin", keywords: "home overview" },
  { id: "ai", label: "Open AI Insights", group: "AI", href: "/admin/ai-insights", keywords: "ai intelligence" },
  { id: "analytics", label: "Open Analytics", group: "Navigation", href: "/admin/analytics", keywords: "charts metrics" },
  { id: "products", label: "Open Products", group: "Commerce", href: "/admin/products", keywords: "inventory catalog" },
  { id: "categories", label: "Open Categories", group: "Commerce", href: "/admin/categories", keywords: "collections" },
  { id: "brands", label: "Open Brands", group: "Commerce", href: "/admin/brands", keywords: "brands logos" },
  { id: "orders", label: "Open Orders", group: "Operations", href: "/admin/orders", keywords: "sales order list" },
  { id: "payments", label: "Open Payments", group: "Operations", href: "/admin/payments", keywords: "transactions" },
  { id: "customers", label: "Open Customers", group: "Operations", href: "/admin/customers", keywords: "crm buyers" },
  { id: "users", label: "Open Users", group: "System", href: "/admin/users", keywords: "admins accounts" },
  { id: "settings", label: "Open Settings", group: "System", href: "/admin/settings", keywords: "configuration" },
  { id: "security", label: "Open Security", group: "System", href: "/admin/security", keywords: "audit logs" },
  { id: "coupons", label: "Open Coupons", group: "Commerce", href: "/admin/coupons", keywords: "discounts promo" },
  { id: "profile", label: "Open Profile", group: "Navigation", href: "/admin/profile", keywords: "account" },
  { id: "new-product", label: "Create Product", group: "Actions", href: "/admin/products/new", keywords: "add create new product" },
  { id: "new-category", label: "Create Category", group: "Actions", href: "/admin/categories", keywords: "add create new category" },
  { id: "new-brand", label: "Create Brand", group: "Actions", href: "/admin/brands", keywords: "add create new brand" },
  { id: "new-coupon", label: "Create Coupon", group: "Actions", href: "/admin/coupons", keywords: "add create new coupon discount" },
  { id: "reports", label: "Open Reports", group: "Analytics", href: "/admin/reports", keywords: "exports analytics report" },
  { id: "logout", label: "Logout", group: "Actions", href: "/logout", keywords: "sign out exit" },
];

function matches(command: CommandItem, query: string) {
  const haystack = `${command.label} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
  const normalized = query.toLowerCase().trim();
  return !normalized || normalized.split(/\s+/).every((word) => haystack.includes(word));
}

export function CommandPalette() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const execute = useCallback(
    async (command: CommandItem) => {
      close();
      if (command.id === "logout") {
        await signOut();
        router.push("/login");
        return;
      }
      router.push(command.href);
    },
    [close, router, signOut],
  );

  const filtered = useMemo(() => commands.filter((command) => matches(command, query)), [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => setActiveIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape" && open) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === "Enter" && filtered[activeIndex]) {
        event.preventDefault();
        execute(filtered[activeIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, activeIndex, execute]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, CommandItem[]>>((result, command) => {
      result[command.group] = [...(result[command.group] ?? []), command];
      return result;
    }, {});
  }, [filtered]);

  if (!open) {
    return (
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] hidden rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-400 shadow-xl backdrop-blur-xl md:block">
        Ctrl/Cmd + K
      </div>
    );
  }

  let cursor = -1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-start justify-center bg-black/60 p-4 pt-[14vh] backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={close}
      >
        <motion.div
          className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-blue-900/40 backdrop-blur-2xl"
          initial={{ y: -24, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: -24, scale: 0.96, opacity: 0 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <Command className="h-5 w-5 text-blue-300" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search commands, products, orders..."
              className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-500"
            />
            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">Esc</kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
                No commands found.
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-4 last:mb-0">
                  <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{group}</p>
                  <div className="space-y-1">
                    {items.map((command) => {
                      cursor += 1;
                      const index = cursor;
                      return (
                        <Button
                          key={command.id}
                          ref={() => undefined}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => execute(command)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                            activeIndex === index ? "bg-gradient-to-r from-blue-600/70 to-cyan-500/50 text-white" : "text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          <Home className="h-4 w-4 shrink-0 text-blue-300" />
                          <span className="flex-1">{command.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

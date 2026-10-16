"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Package, Printer, ShoppingCart, Tag, Ticket } from "lucide-react";

const actions = [
  { label: "Add Product", href: "/admin/products/new", icon: Package, text: "Create a new product listing" },
  { label: "Create Coupon", href: "/admin/coupons", icon: Ticket, text: "Start a new promotion" },
  { label: "Add Category", href: "/admin/categories", icon: Tag, text: "Create a new category group" },
  { label: "View Orders", href: "/admin/orders", icon: ShoppingCart, text: "Check order statuses" },
  { label: "Export Report", href: "/admin/reports", icon: Printer, text: "Download PDF and CSV reports" },
  { label: "Run Analytics", href: "/admin/analytics", icon: BarChart3, text: "Review charts and traffic" },
];

export function QuickActions() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} href={action.href}>
            <motion.div
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl transition hover:bg-white/[0.08]"
              whileHover={{ y: -5, scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{action.label}</h3>
              <p className="mt-1 text-sm text-slate-400">{action.text}</p>
            </motion.div>
          </Link>
        );
      })}
    </section>
  );
}

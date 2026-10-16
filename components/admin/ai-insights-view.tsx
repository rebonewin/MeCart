"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DollarSign,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { HeroOrb, Panel, RevenueTrendChart, type RevenuePoint } from "@/components/admin/insights-charts";

export type AiInsightsData = {
  revenueChangePct: number;
  ordersChangePct: number;
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStock: number;
  outOfStock: number;
  totalInventoryItems: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  pendingReviews: number;
  averageRating: number;
  topProductName: string | null;
  topProductUnits: number;
  restockItem: { name: string; quantity: number } | null;
  trafficEvents: number;
  trafficOrders: number;
  revenueSeries: RevenuePoint[];
  generatedAtLabel: string;
};

function formatMoney(value: number): string {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function riskTone(level: "Low" | "Medium" | "High"): string {
  if (level === "High") return "text-rose-300";
  if (level === "Medium") return "text-amber-300";
  return "text-emerald-300";
}

const ACTIONS = [
  { label: "Create Discount", href: "/admin/coupons", icon: Zap },
  { label: "Restock Product", href: "/admin/inventory", icon: Boxes },
  { label: "Send Notification", href: "/admin/notifications", icon: Rocket },
  { label: "View Analytics", href: "/admin/analytics", icon: Activity },
  { label: "View Orders", href: "/admin/orders", icon: TrendingUp },
  { label: "Generate Report", href: "/admin/reports", icon: CheckCircle2 },
];

export function AiInsightsView({ data }: { data: AiInsightsData }) {
  const healthPct = data.totalCustomers ? Math.round((data.activeCustomers / data.totalCustomers) * 100) : 0;
  const demandScore = Math.max(0, Math.min(100, Math.round(50 + data.ordersChangePct)));
  const riskScore =
    data.lowStock * 2 + data.outOfStock * 5 + data.pendingReviews + (data.revenueChangePct < 0 ? 10 : 0);
  const riskLevel: "Low" | "Medium" | "High" = riskScore < 10 ? "Low" : riskScore < 25 ? "Medium" : "High";

  const insights: { text: string; tone: string }[] = [];
  if (data.totalOrders > 0) {
    insights.push({
      text: `Revenue is ${data.revenueChangePct >= 0 ? "up" : "down"} ${Math.abs(data.revenueChangePct).toFixed(1)}% this month versus last month.`,
      tone: data.revenueChangePct >= 0 ? "from-emerald-400 to-cyan-400" : "from-rose-400 to-orange-400",
    });
  }
  if (data.topProductName) {
    insights.push({
      text: `${data.topProductName} leads sales with ${data.topProductUnits.toLocaleString("en-US")} units sold.`,
      tone: "from-blue-400 to-indigo-400",
    });
  }
  if (data.lowStock + data.outOfStock > 0) {
    insights.push({
      text: `${data.lowStock} item${data.lowStock === 1 ? "" : "s"} low on stock${data.outOfStock ? ` and ${data.outOfStock} out of stock` : ""} — restock before the weekend peak.`,
      tone: "from-amber-400 to-orange-400",
    });
  }
  if (data.pendingReviews > 0) {
    insights.push({
      text: `${data.pendingReviews} review${data.pendingReviews === 1 ? "" : "s"} waiting for moderation${data.averageRating ? `; average rating ${data.averageRating.toFixed(1)}/5` : ""}.`,
      tone: "from-violet-400 to-fuchsia-400",
    });
  }
  if (data.newCustomersThisMonth > 0) {
    insights.push({
      text: `${data.newCustomersThisMonth} new customer${data.newCustomersThisMonth === 1 ? "" : "s"} joined this month; ${data.activeCustomers} active overall.`,
      tone: "from-pink-400 to-rose-400",
    });
  }
  if (insights.length === 0) {
    insights.push({
      text: "No store activity yet — insights will appear as orders, reviews, and customers arrive.",
      tone: "from-slate-400 to-gray-400",
    });
  }

  const metrics = [
    {
      label: "Revenue Forecast",
      value: formatPct(data.revenueChangePct),
      detail: `${formatMoney(data.totalRevenue)} paid all-time`,
      icon: DollarSign,
    },
    {
      label: "Demand Score",
      value: `${demandScore}/100`,
      detail: `${data.totalOrders.toLocaleString("en-US")} orders all-time`,
      icon: TrendingUp,
    },
    {
      label: "Customer Health",
      value: healthPct >= 60 ? "Excellent" : healthPct >= 30 ? "Good" : "Needs attention",
      detail: `${data.activeCustomers}/${data.totalCustomers} active`,
      icon: Users,
    },
    {
      label: "Inventory Health",
      value: data.outOfStock > 0 ? "At risk" : data.lowStock > 0 ? "Watch" : "Stable",
      detail: `${data.lowStock} low · ${data.outOfStock} out of stock`,
      icon: Boxes,
    },
    {
      label: "Engagement",
      value: data.trafficEvents.toLocaleString("en-US"),
      detail: `${data.trafficOrders.toLocaleString("en-US")} orders in the last 14 days`,
      icon: Activity,
    },
    {
      label: "Risk Score",
      value: riskLevel,
      detail: `${riskScore} risk points detected`,
      icon: Shield,
    },
  ];

  const risks: { label: string; level: "Low" | "Medium" | "High" }[] = [
    {
      label: "Low Inventory",
      level: data.outOfStock > 0 ? "High" : data.lowStock > 1 ? "Medium" : "Low",
    },
    {
      label: "Pending Reviews",
      level: data.pendingReviews > 10 ? "High" : data.pendingReviews > 0 ? "Medium" : "Low",
    },
    {
      label: "Revenue Trend",
      level: data.revenueChangePct < -10 ? "High" : data.revenueChangePct < 0 ? "Medium" : "Low",
    },
    {
      label: "Order Pipeline",
      level: data.pendingOrders > 10 ? "Medium" : "Low",
    },
  ];

  const recommendations: string[] = [];
  if (data.restockItem) {
    recommendations.push(
      `Restock ${data.restockItem.name} (only ${data.restockItem.quantity} left) before demand outpaces supply.`,
    );
  }
  if (data.topProductName) {
    recommendations.push(`Feature ${data.topProductName} on the homepage while it leads store sales.`);
  }
  if (data.pendingReviews > 0) {
    recommendations.push(`Clear the ${data.pendingReviews} pending reviews to keep product pages trustworthy.`);
  }
  if (data.newCustomersThisMonth > 0) {
    recommendations.push(
      `Launch a welcome campaign for the ${data.newCustomersThisMonth} customers who joined this month.`,
    );
  }
  if (data.revenueChangePct < 0) {
    recommendations.push(
      `Revenue slipped ${Math.abs(data.revenueChangePct).toFixed(1)}% — consider a limited-time promotion on best sellers.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push("Publish products and run campaigns to unlock tailored recommendations.");
  }

  return (
    <div className="relative min-h-screen space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      </div>

      <motion.section
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart AI Executive Assistant</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">AI Business Intelligence</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Executive summaries, demand insight, customer intelligence, risk signals, and recommendation cards
              derived live from store analytics.
            </p>
            <p className="mt-2 text-xs text-slate-500">Data refreshed {data.generatedAtLabel}</p>
          </div>
          <HeroOrb />
        </div>
      </motion.section>

      <Panel>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Executive Summary</h2>
          <p className="text-sm text-slate-400">Recent patterns derived from store analytics.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((item) => (
            <motion.div
              key={item.text}
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r ${item.tone}`} />
                <p className="text-sm text-slate-200">{item.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-4 text-3xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                </div>
                <Icon className="h-6 w-6 text-blue-300" />
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Revenue Trend</h2>
            <p className="text-sm text-slate-400">Monthly revenue and orders for the last 6 months.</p>
          </div>
          <RevenueTrendChart data={data.revenueSeries} />
        </Panel>

        <Panel>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Risk Detection</h2>
            <p className="text-sm text-slate-400">Operational monitoring based on store signals.</p>
          </div>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <span className="font-medium">{risk.label}</span>
                </div>
                <span className={`text-sm font-semibold ${riskTone(risk.level)}`}>{risk.level}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
            <p className="text-sm text-slate-400">Actions derived from store analytics.</p>
          </div>
          <div className="space-y-3">
            {recommendations.map((item) => (
              <motion.div
                key={item}
                whileHover={{ x: 4 }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <Sparkles className="mt-0.5 h-4 w-4 text-blue-300" />
                <p className="text-sm text-slate-200">{item}</p>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Action Center</h2>
            <p className="text-sm text-slate-400">One-click business actions.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.08]"
                >
                  <Icon className="h-4 w-4 text-blue-300" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          <p className="text-sm text-slate-400">Suggested questions based on current analytics.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-4 text-sm text-slate-200">
            Here are useful prompts you can explore: “Why are sales up?”, “Which products will run out first?”, “Which
            customers may churn?”, and “Which channel has the highest ROI?”
          </p>
          <div className="flex flex-wrap gap-2">
            {["Revenue forecast", "Top product trend", "Customer health", "Inventory risk"].map((chip) => (
              <span key={chip} className="rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  Brain,
  Boxes,
  CheckCircle2,
  DollarSign,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const forecast = [
  { label: "Mon", revenue: 14800, forecast: 15200 },
  { label: "Tue", revenue: 18200, forecast: 18600 },
  { label: "Wed", revenue: 16100, forecast: 16900 },
  { label: "Thu", revenue: 22300, forecast: 23800 },
  { label: "Fri", revenue: 27800, forecast: 29100 },
  { label: "Sat", revenue: 31200, forecast: 32900 },
  { label: "Sun", revenue: 26400, forecast: 28100 },
];

const insights = [
  { text: "Revenue trend is rising 12.4% versus last week — premium demand is accelerating.", tone: "from-emerald-400 to-cyan-400" },
  { text: "Electronics and footwear are the fastest-growing categories by conversion.", tone: "from-blue-400 to-indigo-400" },
  { text: "Nike Vaporfly is trending and may run low before Friday if demand stays flat.", tone: "from-amber-400 to-orange-400" },
  { text: "Retention improved and VIP customers are driving 41% of revenue.", tone: "from-pink-400 to-rose-400" },
  { text: "Profit margin is stable, but shipping costs rose slightly in metro routes.", tone: "from-violet-400 to-fuchsia-400" },
];

const recommendations = [
  "Restock Nike Vaporfly and Tempo Cap before the weekend peak.",
  "Increase display placement for electronics, which has the strongest forecast.",
  "Launch a targeted returning-customer campaign for VIP members.",
  "Offer a measured bundle discount on slow-moving accessories.",
  "Review shipping costs in Delhi and Mumbai to protect margin.",
];

const risks = [
  { label: "Low Inventory", level: "Medium", color: "text-amber-300" },
  { label: "Abandoned Cart Spike", level: "Low", color: "text-emerald-300" },
  { label: "Refund Increase", level: "Low", color: "text-emerald-300" },
  { label: "Revenue Drop", level: "Low", color: "text-emerald-300" },
];

const metrics = [
  { label: "Revenue Forecast", value: "+18.6%", detail: "$328K this month", icon: DollarSign },
  { label: "Demand Score", value: "84/100", detail: "Warm growth momentum", icon: TrendingUp },
  { label: "Customer Health", value: "Excellent", detail: "Retention 68.4%", icon: Users },
  { label: "Inventory Health", value: "Stable", detail: "3 items need attention", icon: Boxes },
  { label: "Marketing Score", value: "+24%", detail: "Paid traffic converting well", icon: Target },
  { label: "Risk Score", value: "Low", detail: "No critical anomalies", icon: Shield },
];

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function AiInsightsPage() {
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
              Executive summaries, demand insight, customer intelligence, risk signals, and recommendation cards powered by existing analytics.
            </p>
          </div>
          <div className="relative flex items-center justify-center">
            <motion.div
              className="flex h-52 w-52 items-center justify-center rounded-full bg-blue-500/10"
              animate={{ scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-violet-500 to-cyan-400 shadow-2xl shadow-blue-500/30">
                <Brain className="h-14 w-14 text-white" />
              </div>
            </motion.div>
          </div>
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
            <h2 className="text-xl font-bold text-white">Revenue Forecast</h2>
            <p className="text-sm text-slate-400">Actual and predicted revenue over the current week.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="aiRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", color: "#fff" }} />
                <Area type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={3} fill="url(#aiRevenue)" />
                <Area type="monotone" dataKey="forecast" stroke="#f472b6" strokeWidth={2} fill="transparent" strokeDasharray="6 6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Risk Detection</h2>
            <p className="text-sm text-slate-400">Operational monitoring based on store signals.</p>
          </div>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-300" />
                  <span className="font-medium">{risk.label}</span>
                </div>
                <span className={`text-sm font-semibold ${risk.color}`}>{risk.level}</span>
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
            {[
              { label: "Create Discount", icon: Zap },
              { label: "Restock Product", icon: Boxes },
              { label: "Send Marketing Email", icon: Rocket },
              { label: "View Analytics", icon: Activity },
              { label: "View Orders", icon: TrendingUp },
              { label: "Generate Report", icon: CheckCircle2 },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.08]"
                >
                  <Icon className="h-4 w-4 text-blue-300" />
                  {action.label}
                </button>
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
            Here are useful prompts you can explore: “Why are sales up?”, “Which products will run out first?”, “Which customers may churn?”, and “Which channel has the highest ROI?”
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

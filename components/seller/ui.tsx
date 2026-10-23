import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function SellerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#d8b45a]">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SellerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.9)] backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SellerStat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "gold" | "green" | "rose";
}) {
  return (
    <SellerCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
              tone === "gold" && "text-[#f5dfa2]",
              tone === "green" && "text-emerald-300",
              tone === "rose" && "text-rose-300",
              tone === "default" && "text-white",
            )}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#d8b45a]">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </SellerCard>
  );
}

export function SellerBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "gold" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        tone === "success" && "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        tone === "warning" && "border-amber-400/25 bg-amber-400/10 text-amber-300",
        tone === "danger" && "border-rose-400/25 bg-rose-400/10 text-rose-300",
        tone === "gold" && "border-[#d8b45a]/30 bg-[#d8b45a]/10 text-[#f5dfa2]",
        tone === "info" && "border-sky-400/25 bg-sky-400/10 text-sky-300",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-slate-300",
      )}
    >
      {children}
    </span>
  );
}

export function SellerButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-xs font-semibold transition",
        variant === "primary"
          ? "bg-[#d8b45a] text-[#1e1708] hover:bg-[#e7c778]"
          : "border border-white/10 text-slate-200 hover:border-[#d8b45a]/40 hover:text-white",
        className,
      )}
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function SellerEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8b45a]/25 bg-[#d8b45a]/10 text-[#d8b45a]">
        <StoreIcon />
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10h18M8 20v-5h8v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function sellerStatusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "ACTIVE" || status === "APPROVED" || status === "DELIVERED" || status === "PAID") return "success";
  if (status === "PENDING" || status === "PROCESSING" || status === "PACKED" || status === "UNDER_REVIEW") return "warning";
  if (status === "REJECTED" || status === "SUSPENDED" || status === "CANCELLED" || status === "FAILED") return "danger";
  return "neutral";
}

"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Home,
  MapPin,
  Package,
  RefreshCw,
  Settings2,
  Truck,
} from "lucide-react";
import { RiderModel } from "@/components/storefront/rider/rider-model";
import { usePrefersReducedMotion } from "@/lib/motion";
import { deriveTracking, type TrackingOrder, type TrackingStageId } from "@/lib/tracking";
import { cn } from "@/lib/cn";

const STAGE_ICONS: Record<TrackingStageId, typeof Check> = {
  processing: Settings2,
  packed: Package,
  shipped: Truck,
  "out-for-delivery": MapPin,
  delivered: Home,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function paymentLabel(value: TrackingOrder["paymentStatus"]) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function OrderTracking({ order }: { order: TrackingOrder }) {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const tracking = deriveTracking(order);
  const phase = tracking.delivered || order.status === "RETURNED"
    ? "celebrate"
    : order.status === "CANCELLED"
      ? "idle"
      : order.status === "PACKED"
        ? "load"
        : tracking.inTransit
          ? "drive"
          : "idle";

  useEffect(() => {
    if (["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status)) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [order.status, router]);

  const tone = tracking.delivered
    ? "border-[var(--lx-emerald)]/30 bg-[var(--lx-emerald)]/10 text-[var(--lx-emerald)]"
    : tracking.halted
      ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
      : "border-[var(--lx-cyan)]/30 bg-[var(--lx-cyan)]/10 text-[var(--lx-cyan)]";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to order
          </Link>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-cyan)]">
            Live atelier tracking
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--lx-text)] sm:text-3xl">
            {order.orderNumber}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em]", tone)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {tracking.statusLabel}
          </span>
          <Button
            type="button"
            onClick={() => router.refresh()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lx-border)] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
            aria-label="Refresh tracking"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="lx-dark-scene relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#070914] p-5 text-white">
        <div aria-hidden className="absolute inset-0 opacity-60">
          <div className="absolute inset-x-0 bottom-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-20 h-px bg-gradient-to-r from-transparent via-[var(--lx-cyan)]/20 to-transparent" />
          <motion.div
            className="absolute bottom-10 h-px w-1/3 bg-gradient-to-r from-transparent via-[var(--lx-gold)] to-transparent"
            animate={reduced ? undefined : { x: ["-120%", "420%"] }}
            transition={{ duration: tracking.inTransit ? 2.4 : 4.8, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[var(--lx-iris)]/10 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[var(--lx-cyan)]/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--lx-gold)]">
              {tracking.delivered ? "Delivered" : tracking.halted ? "Atelier update" : "MECO is on it"}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {tracking.delivered
                ? "Your pieces have arrived."
                : tracking.halted
                  ? order.status === "CANCELLED"
                    ? "This order was cancelled."
                    : "Your return is back at the atelier."
                  : `${tracking.currentStage.label} — ${tracking.statusLabel.toLowerCase()}.`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{tracking.statusCopy}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/60">
                {tracking.delivered ? "Delivered" : "Estimated"} {formatDate(tracking.estimatedDelivery)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/45">
                {paymentLabel(order.paymentStatus)}
              </span>
            </div>
          </div>
          <div className="relative flex h-32 w-full max-w-[15rem] items-end justify-center self-center sm:h-36">
            <RiderModel
              phase={phase}
              tier={2}
              waving={tracking.delivered}
              headlight={tracking.inTransit}
              reduced={reduced}
              className="h-28 w-44 drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
              initial={{ width: 0 }}
              animate={{ width: `${tracking.progress}%` }}
              transition={{ duration: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">
            <span>Atelier</span>
            <span>{tracking.progress}% complete</span>
            <span>Your door</span>
          </div>
        </div>
      </div>

      {tracking.halted ? (
        <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3 text-sm text-[var(--lx-text)]/80" role="status">
          {order.status === "CANCELLED"
            ? "This order is cancelled. If this is unexpected, contact the atelier and we will investigate."
            : "The atelier has received this return. Refunds appear on the original payment method after inspection."}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="lx-card rounded-3xl p-5 sm:p-6" aria-labelledby="timeline-title">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                The journey
              </p>
              <h2 id="timeline-title" className="mt-1 text-lg font-semibold text-[var(--lx-text)]">
                Processing to your door
              </h2>
            </div>
            <span className="text-right text-[10px] text-[var(--lx-muted)]" aria-live="polite">
              Updated {formatDateTime(tracking.lastUpdated)}
            </span>
          </div>

          <ol className="mt-6" aria-label="Order progress">
            {tracking.stages.map((stage, index) => {
              const Icon = STAGE_ICONS[stage.id];
              const isLast = index === tracking.stages.length - 1;
              const complete = stage.state === "complete";
              const current = stage.state === "current";
              return (
                <li
                  key={stage.id}
                  className="relative flex gap-4 pb-7 last:pb-0"
                  aria-current={current ? "step" : undefined}
                >
                  {!isLast ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-px",
                        complete ? "bg-[var(--lx-gold)]/45" : "bg-[var(--lx-border)]",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition",
                      complete
                        ? "border-[var(--lx-gold)]/40 bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]"
                        : current
                          ? "border-[var(--lx-cyan)]/50 bg-[var(--lx-cyan)]/15 text-[var(--lx-cyan)]"
                          : "border-[var(--lx-border)] bg-[var(--lx-surface-2)] text-[var(--lx-muted)]/50",
                    )}
                  >
                    {complete ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                    {current ? (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[var(--lx-surface)] bg-[var(--lx-cyan)]" aria-hidden />
                    ) : null}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          complete || current ? "text-[var(--lx-text)]" : "text-[var(--lx-muted)]/65",
                        )}
                      >
                        {stage.label}
                      </p>
                      {stage.timestampLabel ? (
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--lx-muted)]/60">
                          {stage.timestampLabel}
                          {stage.timestamp ? ` · ${formatDate(stage.timestamp)}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--lx-muted)]">
                      {stage.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="lx-card rounded-3xl p-5 sm:p-6" aria-labelledby="summary-title">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              The parcel
            </p>
            <h2 id="summary-title" className="mt-1 text-lg font-semibold text-[var(--lx-text)]">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces
            </h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--lx-text)]">{item.name}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--lx-muted)]">
                      {[item.size, item.color].filter(Boolean).join(" · ") || item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[var(--lx-text)]/80">
                    ${item.total.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-[var(--lx-border)] pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--lx-muted)]">Subtotal</dt>
                <dd className="text-[var(--lx-text)]/80">${order.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--lx-muted)]">Delivery</dt>
                <dd className="text-[var(--lx-text)]/80">${order.shippingCost.toFixed(2)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--lx-muted)]">Atelier saving</dt>
                  <dd className="text-[var(--lx-emerald)]">−${order.discount.toFixed(2)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-[var(--lx-border)] pt-2 text-sm font-semibold">
                <dt className="text-[var(--lx-text)]">Total</dt>
                <dd className="text-[var(--lx-gold)]">${order.grandTotal.toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          <section className="lx-card rounded-3xl p-5 sm:p-6" aria-labelledby="delivery-title">
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
              Destination
            </p>
            <h2 id="delivery-title" className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--lx-text)]">
              <MapPin className="h-4 w-4 text-[var(--lx-gold)]" aria-hidden />
              {order.customerName}
            </h2>
            <p className="mt-2 text-xs leading-5 text-[var(--lx-muted)]">
              {order.shippingAddress}
              <br />
              {order.city} {order.zip}
            </p>
            <p className="mt-2 text-[10px] text-[var(--lx-muted)]">{order.customerEmail}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/orders/${order.id}`}
                className="rounded-full border border-[var(--lx-border)] px-3 py-1.5 text-[10px] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
              >
                Order summary
              </Link>
              <Link
                href={`/orders/${order.id}/invoice`}
                className="rounded-full border border-[var(--lx-border)] px-3 py-1.5 text-[10px] text-[var(--lx-muted)] transition hover:border-[var(--lx-gold)]/40 hover:text-[var(--lx-gold)]"
              >
                Invoice
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

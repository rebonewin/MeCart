import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Home,
  Package,
  ReceiptText,
  Sparkles,
  Truck,
} from "lucide-react";
import { DeliveryTakeover } from "@/components/storefront/rider/delivery-takeover";
import { Breadcrumbs } from "@/components/shop/storefront-ui";
import { RippleButton } from "@/components/luxe/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed | MeCart",
  description: "Your MeCart order is confirmed and being prepared by the atelier.",
};

const TIMELINE = [
  { label: "Order confirmed", caption: "Payment secured", icon: CheckCircle2, state: "done" },
  { label: "Atelier packing", caption: "Hand-checked & wrapped", icon: Package, state: "active" },
  { label: "In transit", caption: "Live tracking begins", icon: Truck, state: "next" },
  { label: "Delivered", caption: "Signed at your door", icon: Home, state: "next" },
] as const;

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = String(sp.orderId ?? "");
  const orderNumber = String(sp.orderNumber ?? "");
  const invoiceNumber = String(sp.invoiceNumber ?? "");
  const paymentId = String(sp.paymentId ?? "");
  const transactionId = String(sp.transactionId ?? "");
  const status = String(sp.status ?? "");
  const total = String(sp.total ?? "");

  const numericTotal = Number(total);
  const totalLabel = Number.isFinite(numericTotal) && total ? `$${numericTotal.toFixed(2)}` : "—";
  const reference = orderNumber || paymentId || transactionId;

  return (
    <div className="lx-page">
      <DeliveryTakeover orderNumber={orderNumber} />

      <div className="lx-container py-12 sm:py-16 lg:py-20">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Orders", href: "/orders" },
            { label: "Confirmed" },
          ]}
          className="mb-10"
        />

        <div className="mx-auto max-w-3xl text-center">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="lx-conic-ring absolute inset-0 rounded-full opacity-70" />
            <span className="absolute inset-[3px] rounded-full bg-[var(--lx-bg)]" />
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--lx-emerald)]/35 bg-[var(--lx-emerald)]/10 text-[var(--lx-emerald)]">
              <Check className="h-6 w-6" aria-hidden />
            </span>
          </div>
          <p className="lx-eyebrow mt-7 justify-center">Payment successful</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--lx-text)] sm:text-5xl">
            Your order is in the <span className="lx-serif text-[var(--lx-gold)]">atelier.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--lx-muted)] sm:text-base">
            Thank you for choosing MeCart. A receipt is on its way to your email, and the atelier is
            already preparing your order by hand.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {reference ? (
              <span className="lx-chip lx-chip-active font-mono text-[10px] uppercase tracking-[0.16em]">
                Order {reference}
              </span>
            ) : null}
            <span className="lx-chip font-mono text-[10px] uppercase tracking-[0.16em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lx-emerald)]" />
              {status || "Confirmed"}
            </span>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="lx-card overflow-hidden rounded-[2rem]">
            <div className="grid gap-px bg-[var(--lx-border)] sm:grid-cols-3">
              {[
                { label: "Order number", value: orderNumber || "—" },
                { label: "Invoice", value: invoiceNumber || "Issued with dispatch" },
                { label: "Amount paid", value: totalLabel },
              ].map((item) => (
                <div key={item.label} className="bg-[var(--lx-surface)] p-5 text-center sm:p-6">
                  <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-[var(--lx-text)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--lx-border)] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                    Live progress
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--lx-text)]">
                    What happens next
                  </h2>
                </div>
                <Sparkles className="h-5 w-5 text-[var(--lx-gold)]" aria-hidden />
              </div>

              <ol className="mt-6 grid gap-3 sm:grid-cols-4 sm:gap-0">
                {TIMELINE.map((item, index) => {
                  const done = item.state === "done";
                  const active = item.state === "active";
                  return (
                    <li key={item.label} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                      {index < TIMELINE.length - 1 ? (
                        <span
                          aria-hidden
                          className={[
                            "absolute left-[1.05rem] top-9 h-[calc(100%-0.5rem)] w-px sm:left-1/2 sm:top-5 sm:h-px sm:w-full",
                            done ? "bg-[var(--lx-emerald)]/50" : "bg-[var(--lx-border)]",
                          ].join(" ")}
                        />
                      ) : null}
                      <span
                        className={[
                          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                          done
                            ? "border-[var(--lx-emerald)] bg-[var(--lx-emerald)] text-white"
                            : active
                              ? "border-[var(--lx-gold)] bg-[var(--lx-gold)]/12 text-[var(--lx-gold)]"
                              : "border-[var(--lx-border)] bg-[var(--lx-surface)] text-[var(--lx-muted)]",
                        ].join(" ")}
                      >
                        <item.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 pb-2 sm:mt-3 sm:pb-0">
                        <span
                          className={[
                            "block text-xs font-medium",
                            done || active ? "text-[var(--lx-text)]" : "text-[var(--lx-muted)]",
                          ].join(" ")}
                        >
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-[var(--lx-muted)]">
                          {item.caption}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-7 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/50 px-4 py-3">
                <p className="flex items-start gap-2 text-[11px] leading-5 text-[var(--lx-muted)]">
                  <ReceiptText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
                  Keep your order number for any atelier enquiries. Tracking details will appear on your
                  orders page as soon as the parcel is scanned.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                <RippleButton href="/products" variant="primary" size="lg">
                  Continue shopping <ArrowRight className="h-4 w-4" aria-hidden />
                </RippleButton>
                <Link
                  href="/orders"
                  className="lx-glass inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full px-7 text-sm font-medium text-[var(--lx-text)]"
                >
                  View orders <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
                {orderId ? (
                  <Link
                    href={`/orders/${orderId}/invoice`}
                    className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-full px-5 text-sm text-[var(--lx-muted)] transition hover:bg-[var(--lx-surface-2)] hover:text-[var(--lx-text)]"
                  >
                    <ReceiptText className="h-4 w-4" aria-hidden /> Invoice
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
            Packed by hand · Tracked worldwide · 7-day returns
          </p>
        </div>
      </div>
    </div>
  );
}

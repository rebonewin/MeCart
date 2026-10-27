import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  Mail,
  MessageSquare,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";
import { RiderModel } from "@/components/storefront/rider/rider-model";
import { ContactForm } from "@/components/shop/contact-form";

export const metadata: Metadata = {
  title: "Contact the atelier | MeCart",
  description:
    "Reach MeCart client care for orders, products, returns, seller partnerships and press. A human replies within one business day.",
};

const CARE_EMAIL = "care@mecart.store";

const CHANNELS = [
  {
    icon: Mail,
    label: "Client care",
    value: CARE_EMAIL,
    caption: "Orders, sizing, returns and private client requests.",
    href: `mailto:${CARE_EMAIL}`,
  },
  {
    icon: PackageSearch,
    label: "Order desk",
    value: "Track & manage orders",
    caption: "Live tracking, invoices and delivery preferences.",
    href: "/orders",
  },
  {
    icon: Store,
    label: "Seller atelier",
    value: "Open the seller portal",
    caption: "Onboarding, catalogue support and payouts.",
    href: "/seller",
  },
  {
    icon: MessageSquare,
    label: "MECO concierge",
    value: "Ask in the corner",
    caption: "Instant answers on any page, day or night.",
    href: "#composer",
  },
] as const;

const FAQS = [
  {
    question: "How quickly will I hear back?",
    answer:
      "Client care replies within one business day, Monday to Friday. MECO answers instantly in the corner of every page, and can check orders, sizing and returns without waiting for a human.",
  },
  {
    question: "Can I change or cancel an order?",
    answer:
      "Orders can usually be amended within 30 minutes of payment, before the atelier begins packing. Write to us with your order number and the change you need; if the parcel has already left, we will arrange a return instead.",
  },
  {
    question: "Where is my order?",
    answer:
      "Open your orders page to see live tracking, the courier reference and your invoice. If tracking has not moved for 48 hours, send us the order number and we will open a trace with the carrier.",
  },
  {
    question: "What is the returns window?",
    answer:
      "Unworn pieces can be returned within 7 days of delivery in their original packaging. Start from your orders page or write to client care and we will issue a prepaid label where eligible.",
  },
  {
    question: "I want to sell on MeCart.",
    answer:
      "The seller atelier handles applications, catalogue review and payouts. Apply through the seller portal, or write to us with a short introduction to your maison and the pieces you make.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes — MeCart ships to most destinations with tracked, duty-calculated delivery at checkout. Restricted materials and oversized pieces may have limited destinations, shown on the product page.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="lx-page">
      {/* ---------------------------------------------------------------- */}
      {/* Hero — obsidian light field                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="lx-dark-scene relative isolate overflow-hidden border-b border-white/10">
        <LiquidStage variant="hero" intensity={0.85} />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_80%_at_50%_-10%,transparent_28%,rgba(11,11,15,0.78)_100%)]"
          aria-hidden
        />
        <div className="lx-container relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
            <div>
              <p className="lx-eyebrow flex items-center gap-2 text-[var(--lx-gold)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Client care · Maison MeCart
              </p>
              <h1 className="lx-display mt-5 text-white">
                Speak with{" "}
                <span className="lx-editorial text-[var(--lx-gold)]">the atelier.</span>
              </h1>
              <p className="lx-prose mt-6 max-w-xl text-sm text-white/65 sm:text-base">
                An order in transit, a piece you are considering, a partnership you want to build —
                tell us. The same people who prepare the parcels answer the messages.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
                  Mon–Fri · 09:00–18:00 CET
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200/85">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Replies within 1 business day
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${CARE_EMAIL}`}
                  className="lx-btn lx-btn--premium lx-btn--lg"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Write to client care
                </a>
                <Link
                  href="/orders"
                  className="lx-btn lx-btn--glass lx-btn--lg text-white"
                >
                  Track an order
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <p className="mt-5 max-w-md text-[11px] leading-5 text-white/40">
                Prefer to write directly?{" "}
                <a
                  href={`mailto:${CARE_EMAIL}`}
                  className="text-[var(--lx-gold)] underline-offset-4 transition hover:underline"
                >
                  {CARE_EMAIL}
                </a>
              </p>
            </div>

            {/* MECO receiving the message */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="meco-aura" aria-hidden />
              <div className="lx-glass relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--lx-gold)]">
                    MECO · Client companion
                  </p>
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.16em] text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
                <RiderModel
                  phase="wave"
                  tier={1}
                  waving
                  headlight={false}
                  reduced={false}
                  className="mx-auto mt-4 h-32 w-52 drop-shadow-[0_24px_34px_rgba(0,0,0,0.55)] sm:h-40 sm:w-64"
                />
                <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-white/65">
                  “Most answers arrive in seconds. For everything else, a real person is one message
                  away.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Composer + channels                                              */}
      {/* ---------------------------------------------------------------- */}
      <section id="composer" className="lx-container scroll-mt-24 py-14 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div className="lx-card rounded-[1.75rem] p-6 sm:p-9">
            <p className="lx-eyebrow text-[var(--lx-gold)]">Write to us</p>
            <h2 className="lx-title mt-3 text-[var(--lx-text)]">Tell us what you need.</h2>
            <p className="lx-prose mt-3 max-w-lg text-sm text-[var(--lx-muted)]">
              Include the order number if you have one. Every message is read by client care, not a
              ticket robot.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-4">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const external = channel.href.startsWith("mailto:");
              const content = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/60 text-[var(--lx-gold)]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
                      {channel.label}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--lx-text)]">
                      {channel.value}
                      {external ? <ArrowUpRight className="h-3 w-3 text-[var(--lx-gold)]" aria-hidden /> : null}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-[var(--lx-muted)]">
                      {channel.caption}
                    </span>
                  </span>
                </>
              );

              return external ? (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="lx-card group flex items-start gap-3.5 rounded-2xl p-4 transition hover:border-[var(--lx-gold)]/30"
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={channel.label}
                  href={channel.href}
                  className="lx-card group flex items-start gap-3.5 rounded-2xl p-4 transition hover:border-[var(--lx-gold)]/30"
                >
                  {content}
                </Link>
              );
            })}

            <div className="rounded-2xl border border-[var(--lx-gold)]/22 bg-[var(--lx-gold)]/[0.055] p-5">
              <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--lx-gold)]">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                Atelier hours
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--lx-text)]">
                Monday to Friday
                <br />
                <span className="text-[var(--lx-muted)]">09:00–18:00 CET</span>
              </p>
              <p className="mt-3 text-[11px] leading-5 text-[var(--lx-muted)]">
                Weekends: MECO replies instantly, and a human answers first thing Monday.
              </p>
              <p className="mt-4 flex items-center gap-2 border-t border-[var(--lx-border)] pt-4 text-[10px] text-[var(--lx-faint)]">
                <ShieldCheck className="h-3.5 w-3.5 text-[var(--lx-gold)]" aria-hidden />
                Your details are never sold or used for advertising.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FAQ                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[var(--lx-border)] bg-[var(--lx-surface-2)]/35">
        <div className="lx-container py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
            <div>
              <p className="lx-eyebrow text-[var(--lx-gold)]">Before you write</p>
              <h2 className="lx-title mt-3 text-[var(--lx-text)]">Answers, quickly.</h2>
              <p className="lx-prose mt-4 max-w-sm text-sm text-[var(--lx-muted)]">
                The questions client care hears most. If yours is not here, the composer above is the
                fastest route to a person.
              </p>
            </div>

            <div className="divide-y divide-[var(--lx-border)] border-y border-[var(--lx-border)]">
              {FAQS.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-[var(--lx-text)] [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-[var(--lx-gold)] transition-transform duration-300 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="lx-prose max-w-xl pb-5 pr-8 text-[13px] text-[var(--lx-muted)]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

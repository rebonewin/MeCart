import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Gem, Handshake, Compass, Sparkles } from "lucide-react";
import { LiquidStage } from "@/components/luxe/webgl/liquid-stage";
import { VaultStage } from "@/components/luxe/webgl/vault-stage";
import { RiderModel } from "@/components/storefront/rider/rider-model";
import { Counter, Marquee, Reveal, SectionHeader } from "@/components/luxe/primitives";

export const metadata: Metadata = {
  title: "The Maison | MeCart",
  description:
    "MeCart is a curated atelier for fashion, audio, timepieces and technology — considered objects, live inventory and atelier care on every order.",
};

const PILLARS = [
  {
    icon: Gem,
    index: "01",
    title: "Curation over catalogue",
    text: "Every piece is hand-selected by the atelier before it enters the marketplace. If we would not gift it, we will not list it.",
  },
  {
    icon: Handshake,
    index: "02",
    title: "Care without rehearsing it",
    text: "A human answers every message within one business day; returns are effortless for seven days; concierge service is included, not upsold.",
  },
  {
    icon: Compass,
    index: "03",
    title: "Craft in both directions",
    text: "Independent makers keep the main stage and the margins they deserve. Commerce, at its best, is patronage — not volume.",
  },
] as const;

const MOMENTS = [
  {
    eyebrow: "Chapter I — The shelf",
    title: "A considered shelf",
    text: "MeCart began as a private shelf: one client, a handful of objects and the stubborn idea that buying online could feel like being handed something.",
  },
  {
    eyebrow: "Chapter II — The marketplace",
    title: "Maisons, invited",
    text: "The shelf opened into a marketplace. Independent ateliers, small audio houses and watchmakers were invited in — and kept their voice when they arrived.",
  },
  {
    eyebrow: "Chapter III — The concierge",
    title: "MECO joins",
    text: "Then came MECO: a courier with patience, who fetches your cart from any corner of the site and narrates delivery like a small ceremony.",
  },
] as const;

const CATEGORIES = [
  "Fashion",
  "Audio",
  "Timepieces",
  "Technology",
  "Objets",
  "Atelier care",
] as const;

const FOUNDATIONS: Array<{ value: number; decimals: number; suffix: string; label: string }> = [
  { value: 7, decimals: 0, suffix: " days", label: "Effortless returns" },
  { value: 1, decimals: 0, suffix: " day", label: "A human replies within" },
  { value: 100, decimals: 0, suffix: "%", label: "Orders tracked & insured" },
  { value: 24, decimals: 0, suffix: "/7", label: "MECO on the floor" },
];

export default function AboutPage() {
  return (
    <div className="lx-page">
      {/* ---------------------------------------------------------------- */}
      {/* Cinematic hero — the vault on display                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="lx-dark-scene relative isolate overflow-hidden border-b border-white/10">
        <LiquidStage variant="hero" intensity={0.85} />
        <VaultStage variant="relic" className="hidden opacity-80 md:block" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_82%_at_50%_-10%,transparent_30%,rgba(11,11,15,0.8)_100%)]"
        />
        {/* Relic variant frames the object centre-right; keep copy clear of it */}
        <div className="lx-container relative py-20 sm:py-24 lg:py-28 lg:w-[min(44rem,50%)] lg:pl-0 lg:mx-0">
          <p className="lx-eyebrow text-[var(--lx-gold)]">
            <Sparkles className="h-3 w-3" aria-hidden />
            The maison
          </p>
          <h1 className="lx-display mt-6 text-white">
            Commerce, treated as
            <br />
            <span className="lx-editorial text-[var(--lx-gold)]">craft.</span>
          </h1>
          <p className="lx-prose mt-7 max-w-lg text-sm text-white/65 sm:text-base">
            MeCart is an atelier before it is a marketplace. Fashion, audio,
            timepieces and technology — gathered from considered makers,
            presented with patience, and sent to the door like a small event.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/products" className="lx-btn lx-btn--premium lx-btn--lg">
              Enter the collection
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/contact" className="lx-btn lx-btn--glass lx-btn--lg text-white">
              Speak with the atelier
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Discipline strip                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b border-[var(--lx-border)] py-10">
        <div className="lx-container">
          <Marquee duration={38}>
            {CATEGORIES.map((lane) => (
              <span key={lane} className="flex items-center gap-8 px-8 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--lx-muted)]">
                {lane}
                <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--lx-gold)] opacity-70" />
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pillars                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="lx-container py-16 sm:py-24">
        <SectionHeader
          eyebrow="The discipline"
          title="Three quiet rules."
          description="The atelier holds a few rules and keeps them absolutely. Everything else is taste."
        />
        <div className="lx-stagger mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="lx-card lx-card-interactive rounded-[1.4rem] p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/70 text-[var(--lx-gold)]">
                <pillar.icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-muted)]">
                {pillar.index}
              </p>
              <h3 className="mt-2 text-xl font-medium tracking-tight text-[var(--lx-text)]">
                {pillar.title}
              </h3>
              <p className="lx-prose mt-3 text-[13px] text-[var(--lx-muted)]">{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Story chapters                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-[var(--lx-border)] bg-[var(--lx-surface-2)]/35 py-16 sm:py-24">
        <div className="lx-container grid gap-12 lg:grid-cols-[0.42fr_0.58fr] lg:gap-20">
          <div>
            <p className="lx-eyebrow text-[var(--lx-gold)]">The origin</p>
            <h2 className="lx-title mt-4 text-[var(--lx-text)]">
              Built slowly, on purpose.
            </h2>
            <p className="lx-prose mt-5 max-w-sm text-sm text-[var(--lx-muted)]">
              A maison, a marketplace and a courier — each chapter added when
              the previous one could hold its weight.
            </p>
          </div>
          <ol className="lx-stagger space-y-10">
            {MOMENTS.map((moment) => (
              <li key={moment.title} className="relative border-l border-[var(--lx-border)] pl-7">
                <span
                  aria-hidden
                  className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full border border-[var(--lx-gold)] bg-[var(--lx-bg)]"
                />
                <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--lx-gold)]">
                  {moment.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-medium tracking-tight text-[var(--lx-text)]">
                  {moment.title}
                </h3>
                <p className="lx-prose mt-2.5 max-w-xl text-[13px] text-[var(--lx-muted)]">
                  {moment.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Foundations — honest numbers, animated                            */}
      {/* ---------------------------------------------------------------- */}
      <section className="lx-container py-16 sm:py-24">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
          {FOUNDATIONS.map((stat) => (
            <Reveal key={stat.label}>
              <div className="border-l border-[var(--lx-border)] pl-5">
                <p className="text-3xl font-semibold tracking-tight text-[var(--lx-text)]">
                  <Counter value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[var(--lx-muted)]">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* MECO — the courier of the maison                                  */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-[var(--lx-border)] bg-[var(--lx-surface-2)]/35 py-16 sm:py-24">
        <div className="lx-container grid items-center gap-10 lg:grid-cols-[0.55fr_0.45fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-md">
              <div
                aria-hidden
                className="meco-aura"
              />
              <div className="lx-card relative overflow-hidden rounded-[1.75rem] p-8">
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
                MECO™ · Delivery companion
              </p>
              <RiderModel
                phase="wave"
                tier={1}
                waving
                headlight={false}
                reduced={false}
                className="mx-auto mt-6 h-36 w-56 sm:h-40 sm:w-64"
              />
              <p className="mt-6 border-t border-[var(--lx-border)] pt-5 text-[13px] leading-6 text-[var(--lx-muted)]">
                “Watch the lift, not the landing — the parcel tells you when.”
              </p>
              </div>
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <p className="lx-eyebrow text-[var(--lx-gold)]">The courier</p>
            <h2 className="lx-title mt-4 text-[var(--lx-text)]">
              Meet MECO.
            </h2>
            <p className="lx-prose mt-5 max-w-md text-sm text-[var(--lx-muted)]">
              Every order is collected, carried and handed over by MECO — our
              small insistent courier who lives beside your cart, fetches what
              you save, waves when you hover, and celebrates when the parcel
              lands. Mascot, concierge, and the reason the atelier never feels
              like a warehouse.
            </p>
            <ul className="mt-7 space-y-3 text-[13px] text-[var(--lx-text)]">
              {[
                "Grabs the piece you just saved and stores it in your bag",
                "Escorts your flight check-out of the basket",
                "Delivers the small ceremony of an order arriving",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[7px] h-1 w-4 shrink-0 rounded-full bg-gradient-to-r from-[var(--lx-gold)] to-[var(--lx-champagne-warm)]"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Coda                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="lx-container py-16 text-center sm:py-24">
        <Reveal>
          <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-[var(--lx-gold)]">
            From the atelier floor
          </p>
          <h2 className="lx-title mx-auto mt-5 max-w-2xl text-[var(--lx-text)]">
            “Own fewer, better — and let the objects
            <span className="lx-editorial text-[var(--lx-gold)]"> work for years.</span>”
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-[var(--lx-muted)]">
            — the MeCart client charter, first line of the ledger
          </p>
        </Reveal>
      </section>
    </div>
  );
}

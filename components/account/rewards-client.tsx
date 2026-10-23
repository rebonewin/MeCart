"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Crown,
  Eye,
  Flame,
  Gem,
  Heart,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useRecentlyViewed } from "@/lib/recently-viewed-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useShoppingStreak } from "@/lib/hooks/use-shopping-streak";
import {
  LOYALTY_TIERS,
  computeLoyalty,
  type LoyaltyAchievement,
  type LoyaltyOrderFact,
} from "@/lib/loyalty";
import { cn } from "@/lib/cn";

const ACHIEVEMENT_ICONS: Record<string, typeof Award> = {
  "first-order": ShoppingBag,
  collector: Award,
  devotee: Crown,
  connoisseur: Gem,
  explorer: Eye,
  curator: Heart,
  "bag-builder": Package,
  "streak-keeper": Flame,
};

const TIER_ICONS = {
  muse: Sparkles,
  signature: Star,
  noir: Crown,
} as const;

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function AchievementCard({ achievement }: { achievement: LoyaltyAchievement }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.id] ?? Award;
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition",
        achievement.unlocked
          ? "border-[var(--lx-gold)]/30 bg-[var(--lx-gold)]/[0.06]"
          : "border-[var(--lx-border)] bg-[var(--lx-surface)]/50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            achievement.unlocked
              ? "border-[var(--lx-gold)]/30 bg-[var(--lx-gold)]/12 text-[var(--lx-gold)]"
              : "border-[var(--lx-border)] text-[var(--lx-muted)]/60",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-[var(--lx-text)]">{achievement.label}</p>
            {achievement.unlocked ? (
              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--lx-emerald)]">
                Unlocked
              </span>
            ) : (
              <span className="font-mono text-[8px] text-[var(--lx-muted)]/60">
                {achievement.current}/{achievement.target}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] leading-4 text-[var(--lx-muted)]">{achievement.description}</p>
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--lx-border)]"
            role="progressbar"
            aria-label={`${achievement.label} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={achievement.progress}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                achievement.unlocked ? "bg-[var(--lx-gold)]" : "bg-[var(--lx-muted)]/35",
              )}
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RewardsClient({
  user,
  orders,
}: {
  user: { name: string | null; email: string | null } | null;
  orders: LoyaltyOrderFact[];
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const recentlyViewed = useRecentlyViewed();
  const streak = useShoppingStreak();

  const snapshot = computeLoyalty({
    orders,
    viewedCount: recentlyViewed.items.length,
    wishlistCount: wishlist.items.length,
    cartCount: cart.count,
    visitStreak: streak.streak,
  });

  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: dayKey(date),
      label: date.toLocaleDateString("en-US", { weekday: "narrow" }),
      active: streak.visitDates.includes(dayKey(date)),
      today: dayKey(date) === dayKey(today),
    };
  });

  const firstName = user?.name?.split(" ")[0];
  const currentTierIndex = LOYALTY_TIERS.findIndex((tier) => tier.id === snapshot.tier.id);

  return (
    <div className="lx-page mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-gold)]">
            The MeCart circle
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--lx-text)] sm:text-4xl">
            {firstName ? `${firstName}'s atelier` : "Your atelier"}{" "}
            <span className="lx-serif text-[var(--lx-gold)]">standing</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--lx-muted)]">
            Points, tiers and achievements are calculated live from your orders, saved pieces and visits.
            No subscription, no expiry.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--lx-gold)]/35 bg-[var(--lx-gold)]/10 px-4 py-2 text-sm font-medium text-[var(--lx-gold)] transition hover:bg-[var(--lx-gold)]/20"
        >
          Add to your standing
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {!user ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--lx-cyan)]/20 bg-[var(--lx-cyan)]/[0.06] px-4 py-3">
          <p className="text-xs leading-5 text-[var(--lx-text)]/80">
            You&apos;re browsing as a guest. Sign in to connect your order history and keep every point.
          </p>
          <Link href="/login" className="text-xs font-medium text-[var(--lx-cyan)] hover:underline">
            Sign in
          </Link>
        </div>
      ) : null}

      <section className="lx-dark-scene relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#070914] p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--lx-gold)]/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[var(--lx-cyan)]/10 blur-3xl" />
        <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--lx-gold)]/30 bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]">
                {(() => {
                  const Icon = TIER_ICONS[snapshot.tier.id];
                  return <Icon className="h-4 w-4" aria-hidden />;
                })()}
              </span>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/50">
                Current tier
              </p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{snapshot.tier.label}</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-white/55">{snapshot.tier.description}</p>
            <div className="mt-6 flex items-end gap-2">
              <span className="font-mono text-4xl font-semibold tracking-tight text-[var(--lx-gold)]">
                {formatPoints(snapshot.points)}
              </span>
              <span className="pb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                points
              </span>
            </div>
            <div className="mt-5 max-w-md">
              <div className="flex items-center justify-between text-[10px] text-white/45">
                <span>{snapshot.nextTier ? `Next: ${snapshot.nextTier.label}` : "Highest tier reached"}</span>
                <span>{snapshot.nextTier ? `${formatPoints(snapshot.pointsToNext)} to go` : "Noir"}</span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Progress to next loyalty tier"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={snapshot.tierProgress}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
                  style={{ width: `${snapshot.tierProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Orders", value: snapshot.orderCount },
              { label: "Pieces", value: snapshot.itemCount },
              { label: "Day streak", value: snapshot.shoppingStreak },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <p className="font-mono text-xl font-semibold text-white">{stat.value}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">{stat.label}</p>
              </div>
            ))}
            <div className="col-span-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">This week</p>
                <p className="text-[10px] text-[var(--lx-cyan)]">
                  {streak.streak > 0 ? `${streak.streak}-day streak` : "Start a streak"}
                </p>
              </div>
              <div className="mt-2 flex justify-between">
                {week.map((day) => (
                  <div key={day.key} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border text-[8px]",
                        day.active
                          ? "border-[var(--lx-gold)]/50 bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]"
                          : "border-white/10 text-white/25",
                        day.today && !day.active && "border-[var(--lx-cyan)]/40",
                      )}
                      aria-label={`${day.label}${day.active ? ", visited" : ""}`}
                    >
                      {day.active ? <Flame className="h-3 w-3" aria-hidden /> : day.label}
                    </span>
                    <span className="font-mono text-[7px] text-white/25">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="tiers-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">Membership</p>
            <h2 id="tiers-title" className="mt-1 text-xl font-semibold text-[var(--lx-text)]">
              Three circles, one atelier
            </h2>
          </div>
          <p className="text-[10px] text-[var(--lx-muted)]">Tier points never expire</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {LOYALTY_TIERS.map((tier, index) => {
            const Icon = TIER_ICONS[tier.id];
            const active = tier.id === snapshot.tier.id;
            const unlocked = index <= currentTierIndex;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5 transition",
                  active
                    ? "border-[var(--lx-gold)]/40 bg-[var(--lx-gold)]/[0.07]"
                    : unlocked
                      ? "border-[var(--lx-border)] bg-[var(--lx-surface)]"
                      : "border-[var(--lx-border)] bg-[var(--lx-surface)]/45",
                )}
              >
                {active ? (
                  <span className="absolute right-3 top-3 rounded-full bg-[var(--lx-gold)]/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--lx-gold)]">
                    You are here
                  </span>
                ) : null}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border",
                    active
                      ? "border-[var(--lx-gold)]/30 bg-[var(--lx-gold)]/12 text-[var(--lx-gold)]"
                      : "border-[var(--lx-border)] text-[var(--lx-muted)]",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-3 text-lg font-semibold text-[var(--lx-text)]">{tier.label}</h3>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--lx-muted)]">
                  {tier.minPoints === 0 ? "From your first visit" : `${formatPoints(tier.minPoints)}+ points`} ·{" "}
                  {tier.multiplier} points
                </p>
                <ul className="mt-3 space-y-1.5">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-1.5 text-[11px] leading-4 text-[var(--lx-muted)]">
                      <Star className="mt-0.5 h-3 w-3 shrink-0 text-[var(--lx-gold)]/70" aria-hidden />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="achievements-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">Milestones</p>
            <h2 id="achievements-title" className="mt-1 text-xl font-semibold text-[var(--lx-text)]">
              Achievements
            </h2>
          </div>
          <p className="font-mono text-[10px] text-[var(--lx-gold)]">
            {snapshot.unlockedCount}/{snapshot.achievements.length} unlocked
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface)] p-5 sm:p-6" aria-labelledby="earn-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">How points accrue</p>
            <h2 id="earn-title" className="mt-1 text-lg font-semibold text-[var(--lx-text)]">
              Considered actions, considered rewards
            </h2>
          </div>
          <Link href="/wishlist" className="inline-flex items-center gap-1 text-xs text-[var(--lx-cyan)] hover:underline">
            Curate your wishlist
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { title: "Orders", body: "1 point per $1 of completed atelier spend, plus 100 points per order." },
            { title: "Browsing", body: "5 points per piece viewed and 10 points per saved wishlist piece." },
            { title: "Return visits", body: "25 points per consecutive day you return to the atelier." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-[var(--lx-border)] p-3">
              <p className="text-xs font-medium text-[var(--lx-text)]">{item.title}</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--lx-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-[var(--lx-border)] pt-3 text-[10px] leading-4 text-[var(--lx-muted)]">
          Your standing is recomputed from live order and session data. A dedicated loyalty ledger can be
          connected later without changing this dashboard.
        </p>
      </section>
    </div>
  );
}

import type { OrderStatus } from "@/types/database";

export type LoyaltyTierId = "muse" | "signature" | "noir";

export type LoyaltyTier = {
  id: LoyaltyTierId;
  label: string;
  minPoints: number;
  multiplier: string;
  description: string;
  perks: string[];
};

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "muse",
    label: "Muse",
    minPoints: 0,
    multiplier: "1×",
    description: "The first circle. Every order and return visit adds to your standing.",
    perks: ["1 point per $1", "Members-only edits", "Birthday atelier note"],
  },
  {
    id: "signature",
    label: "Signature",
    minPoints: 500,
    multiplier: "1.25×",
    description: "A closer relationship with the atelier, with earlier access to drops.",
    perks: ["1.25× points", "Early access to drops", "Complimentary returns"],
  },
  {
    id: "noir",
    label: "Noir",
    minPoints: 1500,
    multiplier: "1.5×",
    description: "The inner atelier: priority care, private previews and concierge service.",
    perks: ["1.5× points", "Private previews", "Priority concierge", "Atelier gifting"],
  },
];

export type LoyaltyOrderFact = {
  id: string;
  total: number;
  createdAt: string;
  status: OrderStatus;
  itemCount: number;
};

export type LoyaltyAchievement = {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  current: number;
  target: number;
  progress: number;
};

export type LoyaltySnapshot = {
  points: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNext: number;
  tierProgress: number;
  lifetimeSpend: number;
  orderCount: number;
  itemCount: number;
  shoppingStreak: number;
  achievements: LoyaltyAchievement[];
  unlockedCount: number;
};

export type LoyaltyInput = {
  orders: LoyaltyOrderFact[];
  viewedCount: number;
  wishlistCount: number;
  cartCount: number;
  visitStreak: number;
};

function buildAchievement(
  id: string,
  label: string,
  description: string,
  current: number,
  target: number,
): LoyaltyAchievement {
  const safeCurrent = Math.max(0, current);
  return {
    id,
    label,
    description,
    unlocked: safeCurrent >= target,
    current: Math.min(safeCurrent, target),
    target,
    progress: Math.round(Math.min(1, safeCurrent / target) * 100),
  };
}

export function tierForPoints(points: number): LoyaltyTier {
  return (
    LOYALTY_TIERS.slice()
      .reverse()
      .find((tier) => points >= tier.minPoints) ?? LOYALTY_TIERS[0]
  );
}

export function nextTierFor(tier: LoyaltyTier): LoyaltyTier | null {
  const index = LOYALTY_TIERS.findIndex((entry) => entry.id === tier.id);
  return LOYALTY_TIERS[index + 1] ?? null;
}

/**
 * Pure loyalty computation. It can be fed by orders today and by a dedicated
 * loyalty ledger later without changing the dashboard or rewards contract.
 */
export function computeLoyalty(input: LoyaltyInput): LoyaltySnapshot {
  const eligible = input.orders.filter(
    (order) => order.status !== "CANCELLED" && order.status !== "RETURNED",
  );
  const lifetimeSpend = eligible.reduce((sum, order) => sum + order.total, 0);
  const itemCount = eligible.reduce((sum, order) => sum + order.itemCount, 0);
  const orderCount = eligible.length;

  const spendPoints = Math.floor(lifetimeSpend);
  const orderPoints = orderCount * 100;
  const engagementPoints =
    Math.min(input.viewedCount, 60) * 5 +
    Math.min(input.wishlistCount, 24) * 10 +
    Math.min(input.cartCount, 24) * 8;
  const streakPoints = Math.min(Math.max(input.visitStreak, 0), 30) * 25;
  const points = spendPoints + orderPoints + engagementPoints + streakPoints;

  const tier = tierForPoints(points);
  const nextTier = nextTierFor(tier);
  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - points) : 0;
  const tierProgress = nextTier
    ? Math.round(
        Math.min(
          1,
          Math.max(0, (points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)),
        ) * 100,
      )
    : 100;

  const achievements: LoyaltyAchievement[] = [
    buildAchievement("first-order", "First acquisition", "Place your first MeCart order.", orderCount, 1),
    buildAchievement("collector", "Collector", "Place three orders with the atelier.", orderCount, 3),
    buildAchievement("devotee", "Atelier devotee", "Complete five orders.", orderCount, 5),
    buildAchievement("connoisseur", "Connoisseur", "Reach $2,500 in lifetime spend.", Math.floor(lifetimeSpend), 2500),
    buildAchievement("explorer", "Explorer", "View five different pieces.", input.viewedCount, 5),
    buildAchievement("curator", "Curator", "Save three pieces to your wishlist.", input.wishlistCount, 3),
    buildAchievement("bag-builder", "Bag builder", "Build a bag with three pieces.", input.cartCount, 3),
    buildAchievement("streak-keeper", "Streak keeper", "Visit the atelier three days in a row.", input.visitStreak, 3),
  ];

  return {
    points,
    tier,
    nextTier,
    pointsToNext,
    tierProgress,
    lifetimeSpend,
    orderCount,
    itemCount,
    shoppingStreak: Math.max(0, input.visitStreak),
    achievements,
    unlockedCount: achievements.filter((achievement) => achievement.unlocked).length,
  };
}

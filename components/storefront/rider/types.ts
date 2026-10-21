/**
 * Rider domain types.
 *
 * The mascot is intentionally model-agnostic: everything here describes
 * *state*, never appearance. Swapping the scooter artwork later only means
 * replacing `RiderModel` — the controller, queue and cart integration stay
 * untouched.
 */

export type RiderPhase =
  | "idle"
  | "launch"
  | "catch"
  | "load"
  | "drive"
  | "deliver"
  | "celebrate"
  | "return";

/** 0 = empty · 1 = light (1–5) · 2 = heavy (6–10) · 3 = overloaded (10+). */
export type CartTier = 0 | 1 | 2 | 3;

export type FlightJob = {
  id: string;
  name: string;
  image: string;
  from: import("@/lib/motion").Rect | null;
  to: import("@/lib/motion").Rect | null;
  deliver: () => void | Promise<void>;
  resolve: () => void;
};

export function tierForCount(count: number): CartTier {
  if (count <= 0) return 0;
  if (count <= 5) return 1;
  if (count <= 10) return 2;
  return 3;
}

export const TIER_LABEL: Record<CartTier, string> = {
  0: "Empty",
  1: "Light load",
  2: "Heavy load",
  3: "Overloaded",
};

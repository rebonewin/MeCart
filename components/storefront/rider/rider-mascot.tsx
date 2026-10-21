"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useRider } from "./rider-provider";
import { RiderModel } from "./rider-model";
import { TIER_LABEL } from "./types";

const SPARKS = [
  { x: -18, y: -22, delay: 0 },
  { x: 4, y: -30, delay: 0.06 },
  { x: 22, y: -18, delay: 0.12 },
  { x: 26, y: 2, delay: 0.18 },
  { x: -24, y: -4, delay: 0.24 },
] as const;

/**
 * RiderMascot — the header companion that lives beside the cart.
 *
 * It reads rider state from context and exposes two hover affordances:
 * hovering the mascot makes it wave; hovering the cart lights its headlight.
 */
export function RiderMascot({ cartHovered = false, className }: { cartHovered?: boolean; className?: string }) {
  const { phase, tier, reduce, pulse, cartCount, welcomeActive } = useRider();
  const [hovered, setHovered] = useState(false);
  const celebrating = !reduce && (phase === "deliver" || phase === "celebrate");

  return (
    <motion.span
      id="mecart-rider-anchor"
      className={cn("relative inline-flex shrink-0 items-end", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={
        welcomeActive
          ? { opacity: 0 }
          : celebrating
            ? { opacity: 1, scale: [1, 1.14, 1] }
            : { opacity: 1, scale: 1 }
      }
      transition={celebrating ? { duration: 0.5, ease: "easeOut" } : { duration: 0.35 }}
      title={`MECO™ — ${TIER_LABEL[tier]}${cartCount > 0 ? ` · ${cartCount} in bag` : ""}`}
      aria-hidden={welcomeActive}
    >
      <RiderModel
        phase={phase}
        tier={tier}
        waving={hovered && !reduce}
        headlight={cartHovered}
        reduced={reduce}
        className="h-8 w-11 sm:h-11 sm:w-16"
      />

      {celebrating ? (
        <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden>
          {SPARKS.map((spark) => (
            <motion.span
              key={`${spark.x}-${spark.y}`}
              className="absolute h-1 w-1 rounded-full bg-[var(--lx-gold)]"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], x: spark.x, y: spark.y, scale: [0.4, 1, 0.2] }}
              transition={{ duration: 0.7, delay: spark.delay, ease: "easeOut" }}
            />
          ))}
        </span>
      ) : null}

      {/* delivery pulse ring on the cart side */}
      <span key={pulse} className="pointer-events-none absolute inset-0" aria-hidden />
    </motion.span>
  );
}

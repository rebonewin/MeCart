"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
import { EASE, DURATION } from "@/lib/motion/presets";

/**
 * Route-level transition. Next remounts a template on navigation, so this
 * gives every page the same quiet curtain: a breath of rise, never a blur.
 * GPU-friendly transforms only — full-screen filters are reserved for
 * in-page reveals where they matter.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.998 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION.slow, ease: EASE.out }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMounted } from "@/components/luxe/primitives";
import { usePrefersReducedMotion } from "@/lib/motion";
import { RiderModel } from "./rider-model";

/**
 * DeliveryTakeover — the post-checkout cinematic. The rider drives across the
 * viewport with an exhaust trail and motion blur, then the overlay returns to
 * idle and removes itself. Skipped entirely under reduced-motion.
 */
export function DeliveryTakeover({ orderNumber }: { orderNumber?: string }) {
  const reduce = usePrefersReducedMotion();
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const timer = window.setTimeout(() => setDismissed(true), 5200);
    return () => window.clearTimeout(timer);
  }, [reduce]);

  if (!mounted || reduce) return null;
  const visible = !dismissed;

  return createPortal(
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[190] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-[#0B0B0F]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(212,175,55,0.22),transparent_62%)]" />
          <div className="lx-grid absolute inset-0 opacity-40" />

          <motion.p
            role="status"
            className="absolute left-1/2 top-[26%] w-[min(90vw,42rem)] -translate-x-1/2 text-center text-3xl font-semibold tracking-tight text-white sm:text-5xl"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Your Order Is <span className="lx-serif text-[var(--lx-gold)]">On The Way</span>
          </motion.p>
          {orderNumber ? (
            <motion.p
              className="absolute left-1/2 top-[38%] -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.34em] text-[var(--lx-cyan)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {orderNumber}
            </motion.p>
          ) : null}

          {/* the rider crossing the screen */}
          <motion.div
            className="absolute bottom-[16%] left-0 w-[min(52vw,32rem)]"
            initial={{ x: "-40vw" }}
            animate={{ x: "128vw" }}
            transition={{ duration: 3, delay: 0.35, ease: [0.4, 0.05, 0.2, 1] }}
          >
            <div className="relative">
              <RiderModel phase="drive" tier={1} waving={false} headlight reduced={false} className="w-full" />
              {/* motion-blur echo */}
              <RiderModel
                phase="drive"
                tier={1}
                waving={false}
                headlight
                reduced
                className="absolute inset-0 w-full opacity-30 blur-[6px]"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

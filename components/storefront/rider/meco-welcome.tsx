"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMounted } from "@/components/luxe/primitives";
import { onIntroComplete, usePrefersReducedMotion } from "@/lib/motion";
import { RiderModel } from "./rider-model";

const STORAGE_KEY = "mecart.welcome.v1";
const GREETING = {
  title: "Welcome to MeCart",
  body: "Let’s find something amazing today.",
};

type ParkTarget = { x: number; y: number; scale: number };

/**
 * MecoWelcome — the one-time arrival scene.
 *
 * MECO rides in from the left, brakes, waves and greets the visitor, then
 * shrinks into the header anchor where `RiderMascot` lives permanently. The
 * overlay never captures pointer events and is skipped entirely for
 * reduced-motion users, so it can never block the storefront.
 */
export function MecoWelcome({ onStart, onDone }: { onStart: () => void; onDone: () => void }) {
  const mounted = useMounted();
  const reduce = usePrefersReducedMotion();
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [park, setPark] = useState<ParkTarget | null>(null);

  useEffect(() => {
    if (!mounted || reduce || pathname !== "/") return;

    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Storage can be unavailable in strict privacy modes; the intro is optional.
    }

    let cancelled = false;
    const timers: number[] = [];

    // The loader owns the first two seconds of the visit. MECO rolls in only
    // after its exit, so the two scenes read as one sequence instead of
    // competing for the same frame.
    const start = () => {
      if (cancelled) return;

      timers.push(
        window.setTimeout(() => {
          try {
            window.sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            // Ignore storage failures — the scene can still play.
          }
          setPlaying(true);
          onStart();
        }, 200),
      );

      timers.push(
        window.setTimeout(() => {
          setGreeting(true);
        }, 1550),
      );

      timers.push(
        window.setTimeout(() => {
          const anchor = document.getElementById("mecart-rider-anchor");
          const dock = dockRef.current;
          if (!anchor || !dock) return;

          const a = anchor.getBoundingClientRect();
          const d = dock.getBoundingClientRect();
          if (!a.width || !d.width) return;

          setGreeting(false);
          setPark({
            x: a.left + a.width / 2 - (d.left + d.width / 2),
            y: a.top + a.height / 2 - (d.top + d.height / 2),
            scale: Math.max(0.04, Math.min(0.4, a.width / d.width)),
          });
        }, 3550),
      );

      timers.push(
        window.setTimeout(() => {
          setPlaying(false);
          onDone();
        }, 4600),
      );
    };

    const unsubscribe = onIntroComplete(start);

    return () => {
      cancelled = true;
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [mounted, reduce, pathname, onStart, onDone]);

  if (!mounted || reduce) return null;

  return createPortal(
    <AnimatePresence>
      {playing ? (
        <motion.div
          key="meco-welcome"
          className="pointer-events-none fixed inset-0 z-[170] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32 }}
        >
          {/* dim the page base so the arrival feels like a stage */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-[#05060e]/90 via-[#05060e]/40 to-transparent sm:h-[46vh]"
          />

          {/* soft stage light behind the arrival */}
          <motion.div
            aria-hidden
            className="absolute bottom-[-12%] left-[-8%] h-[62vh] w-[62vw] rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(249,115,22,0.16),rgba(99,102,241,0.07)_45%,transparent_70%)] blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: greeting ? 1 : 0.65 }}
            transition={{ duration: 0.8 }}
          />

          <motion.div
            ref={dockRef}
            className="absolute bottom-[3vh] left-3 w-[min(44vw,17rem)] sm:bottom-[6vh] sm:left-8 sm:w-[22rem]"
            initial={{ x: "-132%", opacity: 0 }}
            animate={
              park
                ? { x: park.x, y: park.y, scale: park.scale, opacity: [1, 1, 0] }
                : { x: 0, opacity: 1 }
            }
            transition={
              park
                ? {
                    duration: 1.1,
                    ease: [0.5, 0, 0.18, 1],
                    opacity: { duration: 1.1, times: [0, 0.72, 1], ease: "easeIn" },
                  }
                : { duration: 1.35, ease: [0.12, 0.9, 0.2, 1], opacity: { duration: 0.4 } }
            }
          >
            <div className="relative">
              <AnimatePresence>
                {greeting ? (
                  <motion.div
                    key="meco-greeting"
                    role="status"
                    aria-live="polite"
                    className="absolute bottom-0 left-[calc(100%+0.5rem)] w-[min(50vw,13rem)] sm:bottom-[calc(100%-1.1rem)] sm:left-1/2 sm:ml-[-9.5rem] sm:w-[19rem]"
                    initial={{ opacity: 0, y: 14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 230, damping: 24 }}
                  >
                    <div className="relative rounded-2xl border border-white/12 bg-[#090b16]/90 p-3 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-4">
                      <p className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--lx-gold)] sm:gap-2 sm:text-[9px] sm:tracking-[0.24em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--lx-gold)]" aria-hidden />
                        <span>MECO™</span>
                        <span className="hidden sm:inline">· Delivery companion</span>
                      </p>
                      <p className="mt-2 text-sm font-semibold tracking-tight text-white sm:text-base">
                        {GREETING.title} <span aria-hidden>👋</span>
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/60 sm:text-xs">{GREETING.body}</p>
                      <span
                        aria-hidden
                        className="absolute -left-1.5 bottom-6 h-3 w-3 rotate-45 border-b border-l border-white/12 bg-[#090b16] sm:hidden"
                      />
                      <span
                        aria-hidden
                        className="absolute -bottom-1.5 left-[56%] hidden h-3 w-3 rotate-45 border-b border-r border-white/12 bg-[#090b16] sm:block"
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <RiderModel
                phase={greeting ? "idle" : "drive"}
                tier={1}
                waving={greeting}
                headlight={!greeting}
                reduced={reduce}
                className="w-full drop-shadow-[0_28px_38px_rgba(0,0,0,0.55)]"
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { completeIntro } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* LenisProvider — buttery smooth scroll                               */
/* ------------------------------------------------------------------ */

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch devices already have native momentum scrolling. Running Lenis there
    // only adds a permanent rAF loop and main-thread work.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.innerWidth < 1024) return;

    let cancelled = false;
    let destroyed = false;
    let frame = 0;
    let instance: { raf: (time: number) => void; destroy: () => void } | undefined;

    void import("lenis")
      .then(({ default: Lenis }) => {
        if (cancelled) return;
        const lenis = new Lenis({
          duration: 1.05,
          smoothWheel: true,
          wheelMultiplier: 0.95,
        });
        instance = lenis;

        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (!destroyed) {
        destroyed = true;
        instance?.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}

/* ------------------------------------------------------------------ */
/* CustomCursor — fine-pointer ring cursor                             */
/* ------------------------------------------------------------------ */

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduced) return;
    const timer = window.setTimeout(() => setEnabled(true), 0);
    const move = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[100] hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 mix-blend-difference md:block"
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 700, damping: 45, mass: 0.25 }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* LoadingScreen — first-visit luxury intro (once per session)         */
/* ------------------------------------------------------------------ */

export function LoadingScreen() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      completeIntro();
      return;
    }
    if (window.matchMedia("(max-width: 1023px)").matches) {
      completeIntro();
      return;
    }
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || connection?.effectiveType === "2g") {
      completeIntro();
      return;
    }
    if (window.sessionStorage.getItem("mecart-intro-seen")) {
      completeIntro();
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      window.sessionStorage.setItem("mecart-intro-seen", "1");
      setVisible(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.ceil(Math.random() * 18), 100));
    }, 90);
    const hide = window.setTimeout(() => setVisible(false), 560);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, [visible]);

  return (
    <AnimatePresence onExitComplete={completeIntro}>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#04050d]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(18px)" }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          aria-hidden
        >
          <div className="text-center">
            <motion.p
              className="text-5xl font-black tracking-tight text-white"
              initial={{ letterSpacing: "0.4em", opacity: 0 }}
              animate={{ letterSpacing: "0.08em", opacity: 1 }}
              transition={{ duration: 1 }}
            >
              MECART
            </motion.p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--lx-cyan)]">
              Entering the atelier
            </p>
            <div className="mx-auto mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--lx-iris)] via-[var(--lx-cyan)] to-[var(--lx-gold)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* ScrollProgress — aurora hairline at the top of the viewport         */
/* ------------------------------------------------------------------ */

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      setProgress(scrollHeight > 0 ? window.scrollY / scrollHeight : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden className="fixed left-0 right-0 top-0 z-[90] h-[2px] bg-white/5">
      <motion.div
        className="lx-hairline-x h-full"
        animate={{ scaleX: progress }}
        style={{ transformOrigin: "left" }}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
      />
    </div>
  );
}

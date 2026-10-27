/**
 * MeCart Maison motion language.
 *
 * One canonical grammar shared by every surface: quiet entrances, weighted
 * hovers, decisive presses and celebratory confirmations. Components should
 * consume these constants instead of inventing ad-hoc durations so the whole
 * platform breathes at the same tempo.
 */

export const EASE = {
  /** Primary luxury spring-out curve. */
  out: [0.22, 1, 0.36, 1] as const,
  /** Soft in/out for ambient drift and page curtains. */
  inOut: [0.65, 0, 0.35, 1] as const,
  /** A shorter snap for press states. */
  press: [0.34, 1.56, 0.64, 1] as const,
  /** Linear for marquees and progress rails. */
  linear: [0, 0, 1, 1] as const,
};

export const DURATION = {
  instant: 0.12,
  press: 0.18,
  fast: 0.28,
  base: 0.45,
  slow: 0.72,
  reveal: 0.9,
  cinematic: 1.4,
};

export const DISTANCE = {
  xs: 8,
  sm: 16,
  md: 26,
  lg: 40,
};

/** Shared Framer Motion variants. */
export const pageVariants = {
  initial: { opacity: 0, y: DISTANCE.sm, filter: "blur(10px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DURATION.slow, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    y: -DISTANCE.xs,
    filter: "blur(8px)",
    transition: { duration: DURATION.fast, ease: EASE.inOut },
  },
} as const;

export const revealVariants = {
  hidden: { opacity: 0, y: DISTANCE.md, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DURATION.reveal, ease: EASE.out },
  },
} as const;

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: DISTANCE.sm },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE.out },
  },
} as const;

export const hoverLift = {
  y: -3,
  transition: { duration: DURATION.fast, ease: EASE.out },
};

export const pressScale = {
  scale: 0.975,
  transition: { duration: DURATION.press, ease: EASE.out },
};

export const successPop = {
  initial: { scale: 0.6, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 18 },
  },
};

export const errorShake = {
  animate: { x: [0, -6, 6, -4, 4, 0] },
  transition: { duration: 0.4, ease: EASE.inOut },
};

/** CSS-variable equivalents for non-Framer surfaces. */
export const motionTokens = {
  "--lx-ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--lx-ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  "--lx-dur-instant": "120ms",
  "--lx-dur-fast": "280ms",
  "--lx-dur-base": "450ms",
  "--lx-dur-slow": "720ms",
} as const;

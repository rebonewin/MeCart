"use client";

import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* useMounted — hydration-safe client flag (no setState in effects)    */
/* ------------------------------------------------------------------ */

const subscribeNoop = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered entrance                                  */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  once = true,
  amount = 0.18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  amount?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Magnetic — pointer-attracted wrapper                                */
/* ------------------------------------------------------------------ */

export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Tilt — 3D card tilt with pointer glare                              */
/* ------------------------------------------------------------------ */

export function Tilt({
  children,
  className,
  max = 9,
  glare = true,
  radiusClass = "rounded-3xl",
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  radiusClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 170, damping: 20, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 170, damping: 20, mass: 0.6 });
  const [active, setActive] = useState(false);

  const onMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
    setActive(true);
  };

  const reset = () => {
    rx.set(0);
    ry.set(0);
    setActive(false);
  };

  const glareBg = useTransform(
    [gx, gy],
    ([x, y]: number[]) =>
      `radial-gradient(440px circle at ${x}% ${y}%, rgba(255,255,255,0.13), transparent 55%)`,
  );

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn("[perspective:1100px]", className)}
    >
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        whileHover={reduced ? undefined : { scale: 1.015 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative h-full will-change-transform"
      >
        {children}
        {glare ? (
          <motion.div
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 z-10 transition-opacity duration-300", radiusClass)}
            style={{ background: glareBg, opacity: active ? 1 : 0 }}
          />
        ) : null}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RippleButton — luxury button with click ripple                      */
/* ------------------------------------------------------------------ */

type Ripple = { id: number; x: number; y: number; size: number };

export function RippleButton({
  children,
  href,
  onClick,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "glass" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const idRef = useRef(0);

  const spawn = (event: ReactMouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id = ++idRef.current;
    setRipples((current) => [
      ...current,
      { id, x: event.clientX - rect.left - size / 2, y: event.clientY - rect.top - size / 2, size },
    ]);
  };

  const base =
    "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold tracking-tight transition-all duration-300 will-change-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-sm",
    lg: "h-[3.25rem] px-8 text-[0.95rem]",
  } as const;
  const variants = {
    primary:
      "bg-white text-[#05060e] shadow-[0_18px_50px_-18px_rgba(255,255,255,0.55)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-16px_rgba(255,255,255,0.6)]",
    gold: "bg-gradient-to-r from-[#f5d08a] via-[#f0c46c] to-[#e0a84e] text-[#241a05] shadow-[0_18px_50px_-18px_rgba(240,196,108,0.6)] hover:-translate-y-0.5",
    glass: "lx-glass text-[var(--lx-text)] hover:-translate-y-0.5 hover:bg-white/10",
    ghost: "text-[var(--lx-muted)] hover:bg-white/5 hover:text-white",
  } as const;
  const cls = cn(base, sizes[size], variants[variant], className);

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="lx-ripple"
          style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => setRipples((current) => current.filter((item) => item.id !== ripple.id))}
        />
      ))}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        onClick={(event) => {
          spawn(event);
          onClick?.();
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cls}
      onClick={(event) => {
        spawn(event);
        onClick?.();
      }}
    >
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Counter — animated number                                           */
/* ------------------------------------------------------------------ */

export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 1.8,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState<string | null>(null);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: reduced ? 0 : duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setAnimated(latest.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals, duration, reduced]);

  const display = animated ?? (0).toFixed(decimals);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee — seamless infinite loop                                    */
/* ------------------------------------------------------------------ */

export function Marquee({
  children,
  duration = 40,
  reverse = false,
  className,
  innerClassName,
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("lx-marquee", className)}>
      <div
        className="lx-marquee-track"
        data-direction={reverse ? "reverse" : undefined}
        style={{ "--lx-marquee-duration": `${duration}s` } as CSSProperties}
      >
        <div className={cn("flex shrink-0 items-center", innerClassName)}>{children}</div>
        <div className={cn("flex shrink-0 items-center", innerClassName)} aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeader                                                       */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <p
          className={cn(
            "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--lx-cyan)]",
            align === "center" && "justify-center",
          )}
        >
          <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-[var(--lx-cyan)]" aria-hidden />
          {eyebrow}
          <span
            className="inline-block h-px w-8 bg-gradient-to-l from-transparent to-[var(--lx-cyan)] sm:hidden"
            aria-hidden
          />
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.6rem] lg:leading-[1.1]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-[var(--lx-muted)] sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stars — fractional rating                                           */
/* ------------------------------------------------------------------ */

function StarShape({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <path d="M12 2.6l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.7l-5.9 3.1 1.2-6.6L2.5 9.6l6.6-.9L12 2.6z" />
    </svg>
  );
}

export function Stars({
  rating,
  size = 13,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <span
      className={cn("relative inline-flex items-center", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="flex items-center gap-0.5 text-white/20">
        {[0, 1, 2, 3, 4].map((index) => (
          <StarShape key={index} size={size} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex items-center gap-0.5 overflow-hidden text-[var(--lx-gold)]"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <StarShape key={index} size={size} />
        ))}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* PriceTag — animated price with discount treatment                   */
/* ------------------------------------------------------------------ */

export function PriceTag({
  price,
  original,
  discountPercent = 0,
  size = "md",
  showChip = false,
  className,
}: {
  price: number;
  original?: number;
  discountPercent?: number;
  size?: "sm" | "md" | "lg";
  showChip?: boolean;
  className?: string;
}) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;
  const discounted = discountPercent > 0 && original !== undefined && original > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <Counter
        value={price}
        decimals={2}
        prefix="$"
        className={cn("font-semibold text-white", sizes[size])}
      />
      {discounted ? (
        <span className="text-xs text-white/35 line-through">${original.toFixed(2)}</span>
      ) : null}
      {discounted && showChip ? (
        <span className="rounded-full bg-[var(--lx-gold)]/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--lx-gold)]">
          −{Math.round(discountPercent)}%
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shimmer — skeleton block                                            */
/* ------------------------------------------------------------------ */

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("lx-shimmer rounded-xl", className)} aria-hidden />;
}

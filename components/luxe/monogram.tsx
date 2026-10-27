"use client";

import { cn } from "@/lib/cn";

const SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-16 w-16 text-2xl",
} as const;

/**
 * AuthMonogram — the animated MECART seal.
 *
 * A slow conic halo behind a plated "M", finished with a champagne light
 * sweep on hover and a one-time reveal on mount. Pure paint, no JS loop.
 */
export function AuthMonogram({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "lx-monogram group relative inline-flex select-none items-center justify-center",
        SIZES[size],
        className,
      )}
    >
      {/* slow conic halo */}
      <span aria-hidden className="lx-conic-ring absolute inset-0 rounded-[26%] opacity-90" style={{ animationDuration: "9s" }} />
      {/* static rim so the disc edge reads at rest */}
      <span aria-hidden className="absolute inset-[2px] rounded-[22%] bg-[#0b0b0f]" />
      {/* the letter succeeds the halo */}
      <span
        aria-hidden
        className="lx-monogram-letter relative z-10 bg-gradient-to-br from-[#f8f6f2] via-white to-[#e8d6a5] bg-clip-text font-black tracking-tight text-transparent"
      >
        M
      </span>
      {/* one-shot champagne sweep */}
      <span aria-hidden className="lx-monogram-sweep" />
    </span>
  );
}

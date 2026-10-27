"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { CartTier, RiderPhase } from "./types";

/**
 * RiderModel — an original, hand-built MeCart delivery rider.
 *
 * A 3D-shaded vector character: layered gradients, ambient occlusion, chrome
 * speculars and a warm rim light give it depth without a WebGL payload. The
 * silhouette is deliberately clean so it still reads at 40 px in the header.
 *
 * This remains the single artwork swap point. The controller, queue and cart
 * integration only pass state; replacing this file re-skins the entire mascot.
 */
export type RiderModelProps = {
  phase: RiderPhase;
  tier: CartTier;
  waving: boolean;
  headlight: boolean;
  reduced: boolean;
  className?: string;
};

const SUSPENSION: Record<CartTier, number> = { 0: 0, 1: 0.6, 2: 1.4, 3: 2.1 };
/* Maison palette: champagne livery over obsidian, with warm gold highlights. */
const ORANGE = "#d4af37";
const ORANGE_LIGHT = "#e6c768";
const ORANGE_DARK = "#8c6d1b";
const INK = "#0B0B0F";
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

const CONFETTI = [
  { x: 78, y: 34, dx: -24, dy: -22, delay: 0, color: "#d4af37" },
  { x: 84, y: 30, dx: -8, dy: -30, delay: 0.08, color: "#e6c768" },
  { x: 90, y: 34, dx: 12, dy: -26, delay: 0.04, color: "#f8f6f2" },
  { x: 96, y: 38, dx: 26, dy: -16, delay: 0.14, color: "#d4af37" },
  { x: 74, y: 40, dx: -30, dy: -6, delay: 0.2, color: "#e6c768" },
  { x: 100, y: 42, dx: 30, dy: 2, delay: 0.1, color: "#f8f6f2" },
] as const;

type WheelProps = {
  cx: number;
  cy: number;
  duration: number;
  reduced: boolean;
  uid: string;
};

/** A modern alloy wheel: tire depth, orange pinstripe, six spokes, brake disc. */
function Wheel({ cx, cy, duration, reduced, uid }: WheelProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={17} fill={`url(#${uid}-tire)`} stroke="#2b3446" strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={14.4} fill="none" stroke="#20232B" strokeWidth="1" />
      <circle
        cx={cx}
        cy={cy}
        r={12.4}
        fill="none"
        stroke={ORANGE}
        strokeWidth="0.7"
        strokeDasharray="2 5"
        opacity="0.8"
      />
      <motion.g
        initial={false}
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <circle cx={cx} cy={cy} r={10} fill="#14161C" stroke="#94a3b8" strokeWidth="1.1" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - 9.4}
            stroke="#cbd5e1"
            strokeWidth="1.3"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r={6.6} fill="none" stroke="#64748b" strokeWidth="0.7" opacity="0.55" />
        <circle cx={cx} cy={cy} r={3.2} fill={INK} stroke="#e2e8f0" strokeWidth="0.9" />
      </motion.g>
      <path
        d={`M ${cx + 6} ${cy - 3} q 3 1 2 4`}
        stroke={ORANGE}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

export function RiderModel({ phase, tier, waving, headlight, reduced, className }: RiderModelProps) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const celebrating = phase === "celebrate" || phase === "checkout";
  const flying = phase === "fly";
  const walking = phase === "walk" || phase === "return";
  const driving = phase === "drive" || phase === "deliver" || celebrating || flying;
  const wavingNow = waving || phase === "wave";
  const catching = phase === "catch" || phase === "load" || phase === "deliver";
  const wheelDuration = driving ? (celebrating ? 0.2 : 0.28) : walking ? 1.15 : 1.9;
  const suspension = SUSPENSION[tier];
  const lit = headlight || driving;
  const hasParcel = tier >= 1;
  const blink = headlight && !reduced;
  const peeking = !reduced && phase === "idle" && tier === 0;

  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label="MECO, the MeCart delivery companion"
      className={className}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`${uid}-suit`} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#f3e2ae" />
          <stop offset="42%" stopColor={ORANGE} />
          <stop offset="100%" stopColor={ORANGE_DARK} />
        </linearGradient>
        <linearGradient id={`${uid}-black`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor={INK} />
        </linearGradient>
        <linearGradient id={`${uid}-helmet`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#526078" />
          <stop offset="32%" stopColor="#262A33" />
          <stop offset="100%" stopColor="#0B0B0F" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B0B0F" />
          <stop offset="55%" stopColor="#2B303A" />
          <stop offset="100%" stopColor="#0B0B0F" />
        </linearGradient>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#f8d7b6" />
          <stop offset="100%" stopColor="#e0a87d" />
        </linearGradient>
        <linearGradient id={`${uid}-chrome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="30%" stopColor="#cbd5e1" />
          <stop offset="55%" stopColor="#64748b" />
          <stop offset="80%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id={`${uid}-tire`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#252c3b" />
          <stop offset="60%" stopColor="#15171D" />
          <stop offset="100%" stopColor="#05070b" />
        </linearGradient>
        <linearGradient id={`${uid}-box`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#2b3445" />
          <stop offset="55%" stopColor="#151b28" />
          <stop offset="100%" stopColor={INK} />
        </linearGradient>
        <linearGradient id={`${uid}-lid`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#f3e2ae" />
          <stop offset="55%" stopColor={ORANGE} />
          <stop offset="100%" stopColor={ORANGE_DARK} />
        </linearGradient>
        <linearGradient id={`${uid}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a465c" />
          <stop offset="55%" stopColor="#1c2433" />
          <stop offset="100%" stopColor="#0d121c" />
        </linearGradient>
        <radialGradient id={`${uid}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.2" />
          <stop offset="55%" stopColor={ORANGE} stopOpacity="0.07" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-beam`} cx="0" cy="0.5" r="1">
          <stop offset="0%" stopColor="#fff7d6" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-red`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* warm halo — separates the character from the dark navbar */}
      <ellipse cx="82" cy="78" rx="62" ry="42" fill={`url(#${uid}-halo)`} />

      {/* ground contact shadow */}
      <motion.ellipse
        cx="82"
        cy="112"
        rx="58"
        ry="5"
        fill={`url(#${uid}-shadow)`}
        initial={false}
        animate={reduced ? { opacity: 0.4 } : { opacity: [0.46, 0.32, 0.46], scaleX: [1, 0.96, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {/* hover wake — MECO lifts into its flight mode with a champagne thruster */}
      {flying && !reduced ? (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.ellipse
            cx="80"
            cy="108"
            rx="46"
            ry="7"
            fill={ORANGE}
            animate={{ opacity: [0.1, 0.28, 0.1], scaleX: [0.9, 1.08, 0.9] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
          {[0, 1, 2].map((index) => (
            <motion.ellipse
              key={`jet-${index}`}
              cx={64 + index * 17}
              cy="101"
              rx="2.4"
              ry="6"
              fill={index === 1 ? "#f8f6f2" : ORANGE_LIGHT}
              animate={{ opacity: [0, 0.8, 0], scaleY: [0.4, 1.4, 0.4], y: [0, 8, 16] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: index * 0.12, ease: "easeOut" }}
            />
          ))}
        </motion.g>
      ) : null}

      <motion.g
        initial={false}
        animate={
          reduced
            ? undefined
            : flying
              ? { y: [0, -6.5, 0], rotate: [-1.6, 1.6, -1.6] }
              : celebrating
                ? { y: [0, -4.2, 0] }
                : walking
                  ? { y: [0, -1.6, 0] }
                  : driving
                    ? { y: [0, -1.1, 0] }
                    : { y: [0, -2.4, 0] }
        }
        transition={{
          duration: flying ? 2.4 : celebrating ? 0.55 : walking ? 0.9 : driving ? 0.35 : 4.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.g
          initial={false}
          animate={{ y: suspension }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 18 }}
        >
          {/* rear wheel sits behind the cargo box */}
          <Wheel cx={36} cy={94} duration={wheelDuration} reduced={reduced} uid={uid} />

          {/* rear fender */}
          <path d="M 18 86 Q 36 74 54 86" stroke="#2b3446" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M 20 85 Q 30 78 40 77" stroke={ORANGE} strokeWidth="1.1" fill="none" opacity="0.75" />

          {/* cargo backpack / delivery box — bobs with a slight lag */}
          <motion.g
            initial={false}
            animate={reduced ? undefined : { y: [0, -0.7, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
          >
            <ellipse cx="34" cy="79" rx="21" ry="4" fill="#000" opacity="0.35" />
            <rect x="14" y="42" width="40" height="36" rx="6" fill={`url(#${uid}-box)`} stroke={INK} strokeWidth="1" />
            <rect x="16.5" y="45" width="35" height="30" rx="4" fill="none" stroke="#334155" strokeWidth="0.7" opacity="0.6" />
            <path d="M 18 47 Q 18 44 21 44 H 48" stroke="#f8fafc" strokeWidth="0.7" opacity="0.2" fill="none" />
            <path d="M 17 76 H 51" stroke={ORANGE} strokeWidth="0.8" opacity="0.55" />

            {/* reflective band + brand */}
            <rect x="16" y="64" width="36" height="3" fill="#e2e8f0" opacity="0.9" />
            <rect x="16" y="67" width="36" height="0.9" fill={ORANGE} />
            <text
              x="34"
              y="59"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="7.2"
              fontWeight="800"
              letterSpacing="0.35"
              fill="#f8fafc"
            >
              MECART
            </text>
            <text
              x="34"
              y="63"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="2.7"
              fontWeight="700"
              letterSpacing="1.1"
              fill={ORANGE_LIGHT}
            >
              DELIVERY
            </text>

            {/* side pocket and corner guards */}
            <rect x="40" y="70" width="11" height="7" rx="1.6" fill={INK} stroke="#334155" strokeWidth="0.6" />
            <path d="M 42 73 H 49" stroke={ORANGE} strokeWidth="0.7" />
            <path d="M 16 72 L 20 76 M 52 72 L 48 76" stroke="#475569" strokeWidth="0.8" opacity="0.7" />
            <path d="M 30 42 Q 34 37 38 42" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 31 41 Q 34 38 37 41" stroke="#94a3b8" strokeWidth="0.5" fill="none" />

            {/* extra parcels stack with the cart tier */}
            {hasParcel ? (
              <motion.g
                initial={false}
                animate={catching ? { y: -2.6 } : { y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
              >
                {tier >= 3 ? (
                  <g>
                    <rect x="24" y="21" width="14" height="9" rx="1.5" fill="#f3e8d4" stroke="#b99a6a" strokeWidth="0.6" />
                    <path d="M 31 21 v9" stroke="#b99a6a" strokeWidth="0.7" opacity="0.7" />
                  </g>
                ) : null}
                <rect
                  x={tier >= 2 ? 20 : 22}
                  y={tier >= 2 ? 28 : 30}
                  width={tier >= 2 ? 22 : 17}
                  height={tier >= 2 ? 10 : 8}
                  rx="1.5"
                  fill="#f3e8d4"
                  stroke="#b99a6a"
                  strokeWidth="0.6"
                />
                <path
                  d={`M ${tier >= 2 ? 31 : 30.5} ${tier >= 2 ? 28 : 30} v${tier >= 2 ? 10 : 8}`}
                  stroke="#b99a6a"
                  strokeWidth="0.7"
                  opacity="0.7"
                />
              </motion.g>
            ) : null}

            {/* lid opens to receive the parcel */}
            <motion.g
              initial={false}
              animate={catching ? { rotate: -34 } : { rotate: 0 }}
              transition={{ type: "spring", stiffness: 210, damping: 16 }}
              style={{ transformBox: "fill-box", transformOrigin: "left center" }}
            >
              <rect x="13" y="38" width="42" height="8" rx="4" fill={`url(#${uid}-lid)`} stroke="#6a5214" strokeWidth="0.8" />
              <path d="M 16 40 H 52" stroke="#f8f6f2" strokeWidth="0.7" opacity="0.5" />
              <rect x="30" y="38" width="8" height="8" fill={INK} opacity="0.18" />
            </motion.g>
          </motion.g>

          {/* rear rack */}
          <path d="M 18 79 H 54" stroke={`url(#${uid}-chrome)`} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M 24 79 L 30 91" stroke="#334155" strokeWidth="1.6" />
          <path d="M 50 79 L 44 91" stroke="#334155" strokeWidth="1.6" />

          {/* far leg — depth layer */}
          <path d="M 66 76 Q 73 84 80 85" stroke="#8c6d1b" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M 80 85 Q 88 88 94 86" stroke="#14161C" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.9" />

          {/* sculpted deck */}
          <path d="M 24 86 L 114 86 Q 119 90 113 94 L 29 94 Q 21 92 24 86 Z" fill={`url(#${uid}-paint)`} stroke={INK} strokeWidth="0.8" />
          <rect x="33" y="86" width="74" height="3.4" rx="1.7" fill={INK} />
          {[38, 46, 54, 62, 70, 78, 86, 94, 102].map((x) => (
            <line key={x} x1={x} y1="86.6" x2={x} y2="88.8" stroke="#334155" strokeWidth="0.6" />
          ))}
          <path d="M 27 94 H 112" stroke={`url(#${uid}-chrome)`} strokeWidth="0.9" opacity="0.8" />
          <path d="M 24 86 H 38" stroke={ORANGE} strokeWidth="1.1" opacity="0.9" />
          <path d="M 102 86 H 114" stroke={ORANGE} strokeWidth="1.1" opacity="0.9" />

          {/* tail panel + rear light */}
          <path d="M 22 84 Q 30 76 52 78 L 56 84 Z" fill={`url(#${uid}-paint)`} />
          <path d="M 22 84 Q 30 78 44 79" stroke={ORANGE} strokeWidth="1.5" fill="none" opacity="0.9" />
          <ellipse cx="17" cy="78" rx="5.5" ry="3.2" fill={`url(#${uid}-red)`} />
          <rect x="15" y="76" width="6" height="3" rx="1.5" fill="#ef4444" />
          <circle cx="19.5" cy="82.5" r="1" fill="#fbbf24" opacity="0.85" />

          {/* saddle */}
          <path d="M 56 76 Q 62 70 72 73 L 74 78 L 58 80 Z" fill={INK} stroke="#334155" strokeWidth="0.6" />
          <path d="M 58 76 Q 63 72 70 74" stroke={ORANGE} strokeWidth="0.6" fill="none" opacity="0.8" />
          <path d="M 59 80 H 72" stroke={`url(#${uid}-chrome)`} strokeWidth="0.8" opacity="0.7" />

          {/* front apron / leg shield */}
          <path d="M 106 92 C 110 78 116 64 124 56 L 132 60 C 126 72 122 84 120 94 Z" fill={`url(#${uid}-paint)`} stroke={INK} strokeWidth="0.8" />
          <path d="M 110 88 C 114 76 118 66 124 60 L 127 62 C 122 72 118 82 116 90 Z" fill={ORANGE} opacity="0.92" />
          <path d="M 111 87 C 115 76 119 67 123 62" stroke="#ffedd5" strokeWidth="0.7" fill="none" opacity="0.5" />
          <path d="M 118 94 C 120 84 124 72 129 62" stroke={`url(#${uid}-chrome)`} strokeWidth="0.7" fill="none" opacity="0.8" />

          {/* scooter badge + charge bolt */}
          <circle cx="116" cy="76" r="3" fill={INK} stroke={`url(#${uid}-chrome)`} strokeWidth="0.5" />
          <path d="M 114.8 74.6 L 116.2 74.6 L 115.4 76.2 L 117 76.2 L 114.6 79 L 115.2 77.2 L 114 77.2 Z" fill={ORANGE_LIGHT} />
          <circle cx="112" cy="88" r="1.1" fill="#E6C768" opacity="0.9" />

          {/* front wheel */}
          <Wheel cx={126} cy={94} duration={wheelDuration} reduced={reduced} uid={uid} />

          {/* fork, shock and fender */}
          <path d="M 126 94 L 129 71" stroke={`url(#${uid}-chrome)`} strokeWidth="3" strokeLinecap="round" />
          <path d="M 127 78 q 3 -1 3 -4 M 127 82 q 3 -1 3 -4" stroke={ORANGE} strokeWidth="0.9" fill="none" opacity="0.85" />
          <path d="M 116 82 Q 126 71 136 82" stroke="#2b3446" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 119 81 Q 126 74 133 81" stroke={ORANGE} strokeWidth="1" fill="none" opacity="0.8" />

          {/* steering column */}
          <path d="M 122 92 L 129 54" stroke={`url(#${uid}-chrome)`} strokeWidth="4" strokeLinecap="round" />
          <path d="M 124.5 80 L 127 66" stroke="#20232B" strokeWidth="4.4" strokeLinecap="round" />

          {/* handlebar + grips */}
          <path d="M 126 50 H 146" stroke="#1f2533" strokeWidth="4.6" strokeLinecap="round" />
          <path d="M 134 50 H 146" stroke={INK} strokeWidth="5.6" strokeLinecap="round" />
          <path d="M 126 50 H 134" stroke={`url(#${uid}-chrome)`} strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="146" cy="50" r="1.9" fill={`url(#${uid}-chrome)`} />

          {/* windshield */}
          <path d="M 131 50 Q 134 41 140 37 L 142 45 Q 136 48 133 52 Z" fill="#94a3b8" opacity="0.18" stroke="#cbd5e1" strokeWidth="0.6" />

          {/* twin mirrors */}
          <path d="M 140 47 L 143 36" stroke={`url(#${uid}-chrome)`} strokeWidth="1.6" strokeLinecap="round" />
          <ellipse cx="146" cy="33" rx="4" ry="3" fill={INK} stroke={`url(#${uid}-chrome)`} strokeWidth="0.7" />
          <ellipse cx="146" cy="33" rx="3" ry="2.2" fill="#93c5fd" opacity="0.5" />
          <circle cx="144.8" cy="32" r="0.6" fill="#fff" opacity="0.8" />
          <path d="M 133 48 L 135 40" stroke="#475569" strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
          <ellipse cx="136.5" cy="38" rx="2.6" ry="2" fill="#171920" stroke="#64748b" strokeWidth="0.5" opacity="0.85" />

          {/* LED headlight assembly + beam */}
          <motion.g
            initial={false}
            animate={blink ? { opacity: [1, 0.35, 1, 0.35, 1] } : { opacity: lit ? 1 : 0.12 }}
            transition={blink ? { duration: 1.1, ease: "easeInOut" } : { duration: 0.3 }}
          >
            <polygon points="138,52 168,38 168,72 138,58" fill={`url(#${uid}-beam)`} opacity="0.55" />
            <ellipse cx="137" cy="55" rx="8" ry="5" fill={`url(#${uid}-beam)`} opacity="0.75" />
            <rect x="134" y="53" width="7" height="4" rx="2" fill="#fffbe8" />
            <rect x="131" y="60" width="4" height="1.6" rx="0.8" fill="#fbbf24" />
          </motion.g>

          {/* rider torso — orange jacket, black back panel, white trim */}
          <motion.g
            initial={false}
            animate={reduced ? undefined : { scaleY: [1, 1.025, 1] }}
            transition={{ duration: 3.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          >
            <path
              d="M 64 78 C 60 66 63 52 75 46 C 83 42 89 46 89 54 C 90 66 84 76 76 80 Z"
              fill={`url(#${uid}-suit)`}
            />
            <path d="M 64 78 C 60 66 63 52 75 46 L 78 50 C 68 58 66 70 69 78 Z" fill={`url(#${uid}-black)`} />
            <path d="M 75 46 C 83 42 89 46 89 54" stroke="#ffedd5" strokeWidth="1.2" fill="none" opacity="0.5" />
            <path d="M 85.5 51 L 79.5 77" stroke="#e2e8f0" strokeWidth="0.8" />
            <circle cx="82.5" cy="69" r="1" fill="#cbd5e1" />
            <rect x="78" y="56" width="8" height="6" rx="1.2" fill={INK} />
            <path d="M 79 58 H 85" stroke={ORANGE} strokeWidth="0.7" />
            <path d="M 68 76 Q 74 79 79 77" stroke={INK} strokeWidth="3" fill="none" />
            <rect x="71" y="75.4" width="3.2" height="3.2" rx="0.7" fill={`url(#${uid}-chrome)`} />
            <path d="M 74 54 L 70 74" stroke="#f8fafc" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.35" />
            <path d="M 78 49 L 73 57" stroke="#f8fafc" strokeWidth="0.9" opacity="0.75" />
            <circle cx="81" cy="52" r="0.8" fill={ORANGE_LIGHT} />
          </motion.g>

          {/* collar + neck */}
          <path d="M 83 44 Q 87 41 90 44 L 88 49 Q 85 47 83 48 Z" fill={INK} />
          <path d="M 83.5 45.5 Q 87 43 89.5 46" stroke={ORANGE} strokeWidth="0.7" fill="none" />
          <rect x="86" y="40" width="7" height="6" rx="2.5" fill="#20232B" />

          {/* near leg: orange thigh, black shin, modern sneaker */}
          <path d="M 69 77 Q 77 84 86 85" stroke={ORANGE} strokeWidth="9.5" strokeLinecap="round" fill="none" />
          <path d="M 86 85 Q 95 88 100 85" stroke="#20232B" strokeWidth="7.5" strokeLinecap="round" fill="none" />
          <rect x="82" y="81" width="7" height="7" rx="2" fill={INK} transform="rotate(24 85.5 84.5)" />
          <path d="M 98 82 Q 104 79 110 82 L 114 86 Q 107 89 99 87 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
          <path d="M 99 87 Q 107 89 114 86 L 114 88 Q 107 91 99 89 Z" fill={ORANGE} />
          <path d="M 100 83 L 106 84 M 101 85 L 107 86" stroke={INK} strokeWidth="0.6" />
          <circle cx="105" cy="84.5" r="0.7" fill={ORANGE} />

          {/* head + helmet + friendly expression */}
          <motion.g
            initial={false}
            animate={
              reduced
                ? undefined
                : peeking
                  ? { y: [0, -0.8, 0, -0.8, 0, -0.8, 0], rotate: [0, 0, -7, -7, 0, 6, 0] }
                  : { y: [0, -0.9, 0], rotate: [-1.2, 1.2, -1.2] }
            }
            transition={
              peeking
                ? { duration: 8.5, times: [0, 0.1, 0.18, 0.34, 0.46, 0.58, 0.7], repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }
                : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ transformBox: "fill-box", transformOrigin: "bottom center" }}
          >
            {/* neck + under-helmet layer */}
            <path d="M 84 35 Q 83.4 41.2 86.4 45.2 L 92.6 46 L 94.2 38.2 Z" fill="#171920" />
            <path d="M 88 37.2 L 93.8 38 L 93 44.4 Q 89.6 44.2 87.6 41.8 Z" fill={`url(#${uid}-skin)`} opacity="0.9" />

            {/* face */}
            <ellipse cx="94" cy="32.6" rx="9.6" ry="10.2" fill={`url(#${uid}-skin)`} />
            <path d="M 86 39 Q 92 44 98.6 41.4" stroke="#d99a70" strokeWidth="0.7" fill="none" opacity="0.45" />
            <path d="M 102.6 36.8 Q 103.6 35 103.9 33.2" stroke="#d99a70" strokeWidth="0.5" fill="none" opacity="0.5" />

            {/* helmet shell — 3/4 jet helmet, visor flipped up */}
            <path
              d="M 82.4 33.6 C 81 21.4 87.2 14.8 94.6 14.8 C 101.8 14.8 106.2 20.4 106 27.2 C 103.8 24.3 99.8 23.2 95.8 24.5 C 90 26.6 86.6 31.2 85.6 37.8 C 83.8 36.8 82.8 35.4 82.4 33.6 Z"
              fill={`url(#${uid}-helmet)`}
              stroke={INK}
              strokeWidth="0.8"
            />
            <path d="M 82.7 33 Q 82.6 35.6 85.4 37.6" stroke={`url(#${uid}-chrome)`} strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M 105.8 27.2 Q 100 24 95.8 24.8 C 91 26.4 87.6 31.2 85.8 37.4" stroke={`url(#${uid}-chrome)`} strokeWidth="0.65" fill="none" opacity="0.65" />
            <path d="M 84.6 24.8 C 86.4 17.6 93.4 14.2 99.4 17.6" stroke={ORANGE} strokeWidth="2.9" fill="none" strokeLinecap="round" />
            <path d="M 85.2 23.2 C 87 16.8 93.4 13.8 99 16.8" stroke="#ffe4c7" strokeWidth="0.55" fill="none" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="90.4" cy="20.6" rx="6.4" ry="3" fill="#fff" opacity="0.13" transform="rotate(-24 90.4 20.6)" />
            <circle cx="97.8" cy="17.8" r="1" fill="#fff" opacity="0.5" />
            <path d="M 86.6 23.4 L 88.4 21.8 M 88.8 25.4 L 90.6 23.8" stroke="#171920" strokeWidth="0.8" strokeLinecap="round" opacity="0.65" />

            {/* helmet badge */}
            <circle cx="86.2" cy="28.4" r="2.6" fill="#0B0B0F" stroke={`url(#${uid}-chrome)`} strokeWidth="0.45" />
            <circle cx="86.2" cy="28.4" r="2" fill="none" stroke={ORANGE} strokeWidth="0.4" opacity="0.8" />
            <text
              x="86.2"
              y="29.5"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="2.5"
              fontWeight="800"
              fill="#f8fafc"
            >
              M
            </text>
            <circle cx="87.3" cy="27.3" r="0.4" fill="#fff" opacity="0.5" />

            {/* lifted visor — smoked glass, mirrored hinge */}
            <path
              d="M 94.2 22.8 C 98.6 20.6 103.6 21.8 106.6 25.6 L 105.6 28.2 C 102.4 25.4 98.2 24.6 94.8 26.2 Z"
              fill={`url(#${uid}-visor)`}
              stroke={INK}
              strokeWidth="0.65"
            />
            <path d="M 97.2 24.2 C 100 23.1 102.8 23.7 105.2 25.6" stroke="#a5f3fc" strokeWidth="0.7" fill="none" opacity="0.7" strokeLinecap="round" />
            <path d="M 96 26.2 C 99 24.8 102 25 104.6 26.6" stroke="#f8fafc" strokeWidth="0.4" fill="none" opacity="0.35" strokeLinecap="round" />
            <circle cx="94.6" cy="24.7" r="1.25" fill={`url(#${uid}-chrome)`} stroke={INK} strokeWidth="0.35" />
            <path d="M 94.4 24.8 L 92.8 26.8" stroke={`url(#${uid}-chrome)`} strokeWidth="0.85" strokeLinecap="round" />

            {/* eyes */}
            <motion.g
              initial={false}
              animate={reduced ? undefined : { scaleY: [1, 1, 0.06, 1, 1] }}
              transition={{ duration: 5.4, times: [0, 0.86, 0.9, 0.94, 1], repeat: Infinity, repeatDelay: 1.2 }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <path d="M 94.4 31.5 Q 95.6 30.2 96.9 31.3 Q 95.7 32.7 94.4 31.5 Z" fill="#fff8ef" stroke="#7c4a2f" strokeWidth="0.28" />
              <circle cx="95.7" cy="31.3" r="0.9" fill="#2b1a13" />
              <circle cx="95.45" cy="31" r="0.28" fill="#fff" />
              <path d="M 98.7 31 Q 100.1 29.7 101.6 30.9 Q 100.2 32.4 98.7 31 Z" fill="#fff8ef" stroke="#7c4a2f" strokeWidth="0.3" />
              <circle cx="100.2" cy="31" r="1.05" fill="#2b1a13" />
              <circle cx="99.9" cy="30.6" r="0.32" fill="#fff" />
              <path d="M 94.5 29.1 Q 95.8 28.2 97.1 28.8" stroke="#4a2c1c" strokeWidth="0.55" fill="none" strokeLinecap="round" />
              <path d="M 98.7 28.4 Q 100.2 27.3 101.8 28.1" stroke="#4a2c1c" strokeWidth="0.65" fill="none" strokeLinecap="round" />
            </motion.g>

            {/* nose, smile, cheek */}
            <path d="M 102.7 32.1 Q 104.2 32.9 103.9 34.1 Q 103.5 34.7 102.7 34.6" stroke="#d99a70" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            <circle cx="103.65" cy="34.35" r="0.28" fill="#b97e56" opacity="0.8" />
            <ellipse cx="101.4" cy="35.1" rx="1.15" ry="0.62" fill={ORANGE} opacity="0.16" />
            <motion.g
              initial={false}
              animate={reduced ? undefined : wavingNow ? { scale: [1, 1.08, 1] } : { scaleY: [1, 1.05, 1] }}
              transition={{ duration: wavingNow ? 0.6 : 3.1, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <path d="M 97.6 36.3 Q 100.1 38.9 102.8 36.2" stroke="#4a3a12" strokeWidth="1.15" strokeLinecap="round" fill="none" />
              <path d="M 98.4 36.8 Q 100.1 38.2 102 36.6" stroke="#fff" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.85" />
              <path d="M 99 38.2 Q 100.4 38.5 101.7 37.9" stroke="#e7a87e" strokeWidth="0.45" strokeLinecap="round" fill="none" opacity="0.9" />
            </motion.g>
            <circle cx="97.4" cy="36.1" r="0.35" fill="#8a4b2a" opacity="0.55" />
            <circle cx="103" cy="36" r="0.35" fill="#8a4b2a" opacity="0.55" />

            {/* chin strap */}
            <path d="M 85.2 30.8 Q 85.6 39 92.2 41.4" stroke="#14161C" strokeWidth="1.7" fill="none" strokeLinecap="round" />
            <path d="M 85.4 31.4 Q 86 37.8 90.2 40.4" stroke="#334155" strokeWidth="0.45" fill="none" opacity="0.8" />
            <rect x="86.4" y="36.5" width="2.5" height="1.9" rx="0.6" fill={`url(#${uid}-chrome)`} stroke="#0B0B0F" strokeWidth="0.25" transform="rotate(18 87.6 37.4)" />
          </motion.g>

          {/* near arm — grips the bar, lifts to wave */}
          <motion.g
            initial={false}
            animate={wavingNow ? { rotate: [-6, -38, -22, -38, -6] } : driving ? { rotate: 2 } : { rotate: -3 }}
            transition={
              wavingNow
                ? { duration: 1.15, repeat: Infinity, ease: "easeInOut" }
                : { type: "spring", stiffness: 180, damping: 18 }
            }
            style={{ transformBox: "fill-box", transformOrigin: "0% 50%" }}
          >
            <path d="M 82 48 Q 98 56 121 52" stroke={`url(#${uid}-suit)`} strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 105 55 Q 114 54 121 52" stroke="#20232B" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <path d="M 83 46 Q 98 53 118 50" stroke="#ffedd5" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.7" />
            <path d="M 116 51.5 L 121 54" stroke="#f8fafc" strokeWidth="0.45" strokeLinecap="round" opacity="0.6" />
            <rect x="119.6" y="47" width="9" height="7.2" rx="3.2" fill={INK} />
            <path d="M 121 48.2 Q 127 48.8 127.6 51.2" stroke="#334155" strokeWidth="0.7" fill="none" />
            <path d="M 126.8 46.9 Q 129.2 46.4 129.4 48.2 Q 129.2 49.4 127.8 49.4" fill={INK} stroke="#334155" strokeWidth="0.6" />
            <path d="M 127.8 53.2 Q 129.4 53.6 129.2 54.8 Q 128.8 56 127.2 55.4" fill={INK} stroke="#334155" strokeWidth="0.55" />
            <circle cx="126.8" cy="51" r="0.75" fill="#cbd5e1" />
          </motion.g>

          {/* exhaust puffs */}
          {!reduced ? (
            <g>
              {[0, 1, 2].map((index) => (
                <motion.circle
                  key={index}
                  cx="12"
                  cy="86"
                  r="2.6"
                  fill="#9aa3c0"
                  initial={{ opacity: 0 }}
                  animate={
                    driving
                      ? { opacity: [0, 0.34, 0], x: [0, -18, -30], y: [0, -2, -6], scale: [0.5, 1.1, 1.7] }
                      : { opacity: 0 }
                  }
                  transition={{ duration: 1.05, repeat: driving ? Infinity : 0, delay: index * 0.26, ease: "easeOut" }}
                />
              ))}
            </g>
          ) : null}

          {/* speed lines when driving */}
          {driving && !reduced ? (
            <g>
              {[60, 72, 84].map((y, index) => (
                <motion.line
                  key={y}
                  x1="18"
                  y1={y}
                  x2="2"
                  y2={y}
                  stroke={index === 1 ? ORANGE : "#cbd5e1"}
                  strokeWidth="1"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0], x: [4, -8, -14] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.12, ease: "easeOut" }}
                />
              ))}
            </g>
          ) : null}
        </motion.g>

        {/* cart-update reaction: a small burst as the parcel settles into the box */}
        {catching && !reduced ? (
          <g aria-hidden>
            {[0, 1, 2, 3].map((index) => (
              <motion.circle
                key={`parcel-spark-${index}`}
                cx={34 + (index - 1.5) * 4}
                cy={38}
                r={1.1}
                fill={index % 2 === 0 ? ORANGE_LIGHT : "#f8f6f2"}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.9, 0],
                  y: [0, -9 - index * 2],
                  x: [0, (index - 1.5) * 7],
                  scale: [0.6, 1, 0.4],
                }}
                transition={{ duration: 0.75, delay: index * 0.06, ease: "easeOut" }}
              />
            ))}
          </g>
        ) : null}

        {/* celebrate / checkout success reaction: champagne confetti */}
        {celebrating && !reduced ? (
          <g aria-hidden>
            {CONFETTI.map((piece, index) => (
              <motion.circle
                key={`confetti-${index}`}
                cx={piece.x}
                cy={piece.y}
                r={index % 3 === 0 ? 1.4 : 1}
                fill={piece.color}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 0], x: piece.dx, y: piece.dy, scale: [0.5, 1, 0.3] }}
                transition={{ duration: 1.1, delay: piece.delay, repeat: Infinity, repeatDelay: 0.5, ease: "easeOut" }}
              />
            ))}
          </g>
        ) : null}
      </motion.g>
    </svg>
  );
}

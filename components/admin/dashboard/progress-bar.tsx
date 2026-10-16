"use client";

import { motion } from "framer-motion";

export function ProgressBar({ value, delay = 0.2 }: { value: number; delay?: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 1, delay }}
      />
    </div>
  );
}

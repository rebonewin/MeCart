"use client";

import { motion } from "framer-motion";

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -6 }}
    >
      {children}
    </motion.div>
  );
}

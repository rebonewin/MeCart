"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const canHover = window.matchMedia("(pointer: fine)").matches;
    if (!canHover) return;
    const timer = window.setTimeout(() => setEnabled(true), 0);
    const move = (event: MouseEvent) => setPosition({ x: event.clientX, y: event.clientY });
    window.addEventListener("mousemove", move);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  if (!enabled) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[100] hidden h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 mix-blend-difference md:block"
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 700, damping: 45, mass: 0.25 }}
    />
  );
}

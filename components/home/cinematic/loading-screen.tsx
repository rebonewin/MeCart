"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen() {
  const [progress, setProgress] = useState(8);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(current + Math.ceil(Math.random() * 10), 100);
      });
    }, 140);

    const hide = window.setTimeout(() => setVisible(false), 2300);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(hide);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020617]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(18px)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="text-center">
            <motion.p
              className="text-5xl font-black tracking-tight text-white"
              initial={{ letterSpacing: "0.4em", opacity: 0 }}
              animate={{ letterSpacing: "0.08em", opacity: 1 }}
              transition={{ duration: 1.1 }}
            >
              MECART
            </motion.p>
            <p className="mt-4 text-sm uppercase tracking-[0.35em] text-blue-300">Loading the future</p>
            <div className="mx-auto mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

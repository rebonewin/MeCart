"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function HomeHero() {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(y, { stiffness: 140, damping: 18 });
  const rotateY = useSpring(x, { stiffness: 140, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px * 16);
    y.set(py * -16);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.from(contentRef.current.querySelectorAll(".gsap-reveal"), {
      y: 48,
      opacity: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
    });
  }, []);

  const floating = [
    { icon: "🛍️", label: "Shopping Bag", x: "12%", y: "16%", delay: 0 },
    { icon: "👟", label: "Sneakers", x: "72%", y: "12%", delay: 0.3 },
    { icon: "⌚", label: "Watch", x: "82%", y: "48%", delay: 0.6 },
    { icon: "📱", label: "Phone", x: "66%", y: "72%", delay: 0.9 },
    { icon: "💻", label: "Laptop", x: "24%", y: "70%", delay: 1.2 },
    { icon: "🎧", label: "Headphones", x: "8%", y: "48%", delay: 1.5 },
    { icon: "🧥", label: "Fashion", x: "42%", y: "10%", delay: 1.8 },
    { icon: "🎁", label: "Gift Box", x: "48%", y: "78%", delay: 2.1 },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute right-[-5%] top-[10%] h-96 w-96 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[30%] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
          ref={contentRef}
        >
          <div className="gsap-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur dark:border-blue-900/70 dark:bg-gray-900/70 dark:text-blue-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            New season. New arrivals. New you.
          </div>
          <h1 className="gsap-reveal text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Discover the <span className="bg-gradient-to-r from-slate-900 via-blue-600 to-amber-500 bg-clip-text text-transparent">Future of Shopping</span>
          </h1>
          <p className="gsap-reveal mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Premium fashion, electronics, sneakers, accessories, and lifestyle products — curated into one luxury experience.
          </p>
          <div className="gsap-reveal mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="magnetic-button rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-7 py-3.5 font-semibold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="magnetic-button rounded-2xl border border-gray-200 bg-white/80 px-7 py-3.5 font-semibold text-gray-900 shadow-sm backdrop-blur transition hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-900/80 dark:text-white"
            >
              Explore Categories
            </Link>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4 text-center">
            {[
              ["10K+", "Products"],
              ["24/7", "Support"],
              ["7 Days", "Returns"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-gray-900/70">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          ref={ref}
          onMouseMove={handleMove}
          onMouseLeave={reset}
          style={{ rotateX, rotateY }}
          className="relative mx-auto aspect-square w-full max-w-xl [perspective:1200px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-full w-full"
          >
            <div className="absolute inset-10 rounded-[2rem] bg-gradient-to-br from-white/80 to-white/20 shadow-2xl backdrop-blur-xl dark:from-gray-900/80 dark:to-gray-950/20" />
            <div className="absolute inset-16 rounded-[2rem] border border-white/40 bg-gradient-to-br from-blue-600/10 to-amber-500/10" />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20 blur-3xl" />
            {floating.map((item, index) => (
              <motion.div
                key={item.label}
                className="glass-float absolute flex items-center gap-2 rounded-2xl border border-white/40 bg-white/60 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-gray-700/60 dark:bg-gray-900/60"
                style={{ left: item.x, top: item.y }}
                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                transition={{
                  delay: item.delay,
                  y: { duration: 4 + (index % 3), repeat: Infinity, ease: "easeInOut" },
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

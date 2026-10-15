"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/home/categories";
import { ProductCardHome } from "@/components/home/product-card";
import { products } from "@/lib/mock-data";

export function FlashSale() {
  const [time, setTime] = useState({ hours: 5, minutes: 24, seconds: 38 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((current) => {
        let { hours, minutes, seconds } = current;
        seconds -= 1;
        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
        }
        if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }
        if (hours < 0) return { hours: 5, minutes: 24, seconds: 38 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (value: number) => value.toString().padStart(2, "0");
  const saleItems = products.slice(1, 5);

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-700 to-amber-500 p-1 shadow-2xl">
        <div className="rounded-[calc(2rem-4px)] bg-white/92 p-6 backdrop-blur dark:bg-gray-950/90 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="Limited time" title="Flash Sale" description="Hurry up before the premium deals disappear." />
            <div className="flex gap-4 rounded-2xl bg-gray-900 px-5 py-4 text-white shadow-xl dark:bg-gray-800">
              {[
                ["Hours", time.hours],
                ["Minutes", time.minutes],
                ["Seconds", time.seconds],
              ].map(([label, value]) => (
                <div key={label} className="text-center">
                  <motion.p
                    key={value}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-black tabular-nums"
                  >
                    {pad(value as number)}
                  </motion.p>
                  <p className="text-xs uppercase tracking-wide text-gray-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {saleItems.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="relative rounded-3xl"
              >
                <div className="absolute -right-2 -top-2 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-gray-900 shadow-lg">
                  Sale
                </div>
                <ProductCardHome product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

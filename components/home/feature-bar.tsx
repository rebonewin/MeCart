"use client";

import { motion } from "framer-motion";

import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const features = [
  { icon: <Truck className="h-6 w-6" />, title: "Free Shipping", text: "On eligible orders" },
  { icon: <ShieldCheck className="h-6 w-6" />, title: "Secure Payment", text: "100% protected checkout" },
  { icon: <RotateCcw className="h-6 w-6" />, title: "Easy Returns", text: "7-day hassle-free returns" },
  { icon: <Headphones className="h-6 w-6" />, title: "24/7 Support", text: "Always here to help" },
];

export function FeatureBar() {
  return (
    <section className="px-4 py-4">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="glass-card flex items-center gap-3 rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/70"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -4 }}
          >
            <span className="text-blue-600 dark:text-blue-300">{feature.icon}</span>
            <div>
              <p className="font-semibold">{feature.title}</p>
              <p className="text-xs text-gray-500">{feature.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

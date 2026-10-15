"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  { name: "Men", slug: "men", icon: "👔", tone: "from-blue-500/20 to-indigo-500/10" },
  { name: "Women", slug: "women", icon: "👗", tone: "from-pink-500/20 to-rose-500/10" },
  { name: "Girls", slug: "girls", icon: "🎀", tone: "from-fuchsia-500/20 to-pink-500/10" },
  { name: "Baby Boy", slug: "baby-boy", icon: "👶", tone: "from-cyan-500/20 to-blue-500/10" },
  { name: "Electronics", slug: "electronics", icon: "📱", tone: "from-indigo-500/20 to-violet-500/10" },
  { name: "Shoes", slug: "shoes", icon: "👟", tone: "from-amber-500/20 to-orange-500/10" },
  { name: "Fashion", slug: "fashion", icon: "✨", tone: "from-emerald-500/20 to-teal-500/10" },
  { name: "Accessories", slug: "accessories", icon: "⌚", tone: "from-slate-500/20 to-gray-500/10" },
];

export function CategorySection() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Browse by category"
          title="Shop your world"
          description="Collections curated to make finding your next favorite effortless."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/categories/${category.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-5 text-center shadow-sm backdrop-blur transition hover:-translate-y-2 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/70">
                  <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${category.tone} text-3xl transition group-hover:scale-110 group-hover:rotate-6`}>
                    {category.icon}
                  </div>
                  <p className="text-sm font-semibold">{category.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base text-gray-600 dark:text-gray-300">{description}</p>}
    </div>
  );
}

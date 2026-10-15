"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/home/categories";

const promotions = [
  { title: "Summer Collection", text: "Up to 40% off selected styles", gradient: "from-blue-600 to-indigo-700", icon: "☀️" },
  { title: "New Arrivals", text: "Fresh drops every week", gradient: "from-amber-500 to-orange-600", icon: "✨" },
  { title: "Up to 70% Off", text: "Luxury for less", gradient: "from-slate-900 to-gray-700", icon: "🏷️" },
  { title: "Gaming Zone", text: "Gear up and play", gradient: "from-violet-600 to-fuchsia-600", icon: "🎮" },
  { title: "Luxury Watches", text: "Timeless elegance", gradient: "from-emerald-600 to-teal-700", icon: "⌚" },
  { title: "Beauty Edit", text: "Glow all season", gradient: "from-rose-500 to-pink-600", icon: "💄" },
];

const reasons = [
  { icon: "⚡", title: "Fast Delivery", text: "Swift, reliable shipping on every order." },
  { icon: "🔐", title: "Secure Payments", text: "Protected checkout with trusted gateways." },
  { icon: "💎", title: "Quality Products", text: "Curated premium items built to last." },
  { icon: "🤝", title: "Customer Support", text: "Real humans ready to help 24/7." },
];

const reviews = [
  { name: "Sarah M.", role: "Verified Buyer", text: "The quality, delivery speed, and packaging were all flawless. MeCart feels truly premium.", rating: 5 },
  { name: "Daniel R.", role: "Verified Buyer", text: "Beautiful products at fair prices. The shopping experience is smooth from search to checkout.", rating: 5 },
  { name: "Ananya P.", role: "Verified Buyer", text: "The discounts are real and the product images are accurate. Definitely my go-to store now.", rating: 4 },
];

const brands = ["Nike", "Apple", "Samsung", "Adidas", "Sony", "Tommy", "Puma", "Gucci"];

export function PromoBanners() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Luxury edits" title="Promotional Banners" description="Immersive campaigns designed to feel like a flagship store." />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo.title}
              className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${promo.gradient} p-6 text-white shadow-xl`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="absolute -right-6 -top-6 text-9xl opacity-20 transition group-hover:scale-110">{promo.icon}</div>
              <p className="text-sm uppercase tracking-[0.2em] opacity-80">Limited edition</p>
              <h3 className="mt-2 text-2xl font-black">{promo.title}</h3>
              <p className="mt-2 text-white/85">{promo.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Why MeCart" title="Why Choose Us" description="Everything you love about premium shopping, backed by trust." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              className="glass-card rounded-3xl border border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/75"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -8 }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl text-white shadow-lg">
                {reason.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{reason.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{reason.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSlider() {
  const [index, setIndex] = useState(0);
  const review = reviews[index];

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/40 bg-white/75 p-8 text-center shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/75">
        <SectionHeading eyebrow="Loved worldwide" title="Customer Reviews" description="Real feedback from real shoppers." />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mx-auto max-w-2xl"
          >
            <p className="text-2xl leading-9 text-gray-700 dark:text-gray-200">“{review.text}”</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-amber-500 text-lg font-bold text-white">
                {review.name[0]}
              </div>
              <div className="text-left">
                <p className="font-semibold">{review.name}</p>
                <p className="text-sm text-gray-500">{review.role}</p>
              </div>
            </div>
            <p className="mt-3 text-lg text-amber-500">{"★".repeat(review.rating)}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex justify-center gap-3">
          {reviews.map((item, i) => (
            <button
              key={item.name}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-blue-600" : "w-2.5 bg-gray-300 dark:bg-gray-700"}`}
              aria-label={`Show review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandsCarousel() {
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading eyebrow="Trusted brands" title="Brands Section" description="Scrolling premium partners and labels." />
        <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-6 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/60">
          <motion.div
            className="flex gap-10 whitespace-nowrap text-2xl font-bold text-gray-700 dark:text-gray-200"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            {[...brands, ...brands].map((brand, index) => (
              <span key={`${brand}-${index}`} className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-600 to-amber-500" />
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function NewsletterSection() {
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks for subscribing to MeCart");
    setEmail("");
  };

  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-blue-100">Stay in the loop</p>
            <h2 className="mt-3 text-3xl font-black">Newsletter</h2>
            <p className="mt-3 text-white/85">Get first access to launches, private drops, and premium offers.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className="h-12 flex-1 rounded-2xl border border-white/20 bg-white/15 px-4 text-white placeholder:text-white/60 outline-none backdrop-blur transition focus:bg-white/25"
            />
            <button className="h-12 rounded-2xl bg-white px-6 font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

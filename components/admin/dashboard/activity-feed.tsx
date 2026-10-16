"use client";

import { motion } from "framer-motion";

export type ActivityItem = { text: string; time: string; color: string };

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-3 p-5">
      {items.map((event, index) => (
        <motion.div
          key={`${event.text}-${index}`}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <div className={`mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r ${event.color}`} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">{event.text}</p>
            <p className="text-xs text-slate-400">{event.time}</p>
          </div>
        </motion.div>
      ))}
      {items.length === 0 && <p className="text-sm text-slate-400">No data yet</p>}
    </div>
  );
}

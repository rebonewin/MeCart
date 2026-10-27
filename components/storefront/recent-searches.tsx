"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";

const KEY = "mecart.recent-searches";

export function RecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (recent.length) return;
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) {
          setRecent(parsed.filter((item): item is string => typeof item === "string").slice(0, 5));
        }
      } catch {
        setRecent([]);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [recent.length]);

  if (!recent.length) return null;

  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-muted)]">
          <Clock3 className="h-3 w-3" aria-hidden /> Recent searches
        </p>
        <Button
          type="button"
          onClick={() => {
            setRecent([]);
            try {
              window.localStorage.removeItem(KEY);
            } catch {
              // ignore storage failures
            }
          }}
          className="text-[11px] text-[var(--lx-muted)] transition hover:text-[var(--lx-text)]"
        >
          Clear
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recent.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="lx-chip"
          >
            {term}
            <X className="h-3 w-3 opacity-40" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}

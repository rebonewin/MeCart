"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mecart-visit-streak-v1";
const MAX_DAYS = 90;

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readDates(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
      .slice(-MAX_DAYS);
  } catch {
    return [];
  }
}

function consecutiveDays(dates: Set<string>) {
  let streak = 0;
  const cursor = new Date();
  while (streak < MAX_DAYS) {
    if (!dates.has(dateKey(cursor))) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Local-first shopping streak. It records one visit per local calendar day and
 * can later be replaced by server-side loyalty events without changing consumers.
 */
export function useShoppingStreak() {
  const [streak, setStreak] = useState(0);
  const [visitDates, setVisitDates] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const today = dateKey(new Date());
      const existing = readDates();
      const set = new Set(existing);
      set.add(today);
      const next = [...set].sort().slice(-MAX_DAYS);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // private mode — the in-memory streak still works for this visit
      }
      setVisitDates(next);
      setStreak(consecutiveDays(set));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return { streak, visitDates, hydrated };
}

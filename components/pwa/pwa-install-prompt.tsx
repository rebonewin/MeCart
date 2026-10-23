"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/lib/hooks/use-pwa-install";

const DISMISS_KEY = "mecart-install-dismissed-at";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function PwaInstallPrompt() {
  const { available, installed, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!available || installed || recentlyDismissed()) return;
    const timer = window.setTimeout(() => setVisible(true), 8000);
    return () => window.clearTimeout(timer);
  }, [available, installed]);

  if (!visible || !available || installed) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage can be unavailable
    }
  };

  return (
    <div
      role="region"
      aria-label="Install MeCart"
      className="fixed bottom-24 left-4 z-[85] w-[min(calc(100vw-2rem),20rem)] rounded-2xl border border-[var(--lx-gold)]/25 bg-[#0b0f18]/95 p-4 text-white shadow-2xl backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lx-gold)]/15 text-[var(--lx-gold)]">
        <Download className="h-4 w-4" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold">Keep the atelier close</p>
      <p className="mt-1 text-[11px] leading-5 text-white/50">
        Install MeCart for a full-screen storefront, faster returns and offline browsing.
      </p>
      <button
        type="button"
        onClick={async () => {
          const outcome = await promptInstall();
          if (outcome !== "dismissed") setVisible(false);
        }}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--lx-gold)] px-3.5 py-1.5 text-[11px] font-semibold text-[#17120a] transition hover:bg-[var(--lx-gold-soft)]"
      >
        Install app
      </button>
    </div>
  );
}

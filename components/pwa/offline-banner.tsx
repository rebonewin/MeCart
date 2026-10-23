"use client";

import { CloudOff, RefreshCw, WifiOff } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  const cart = useCart();
  if (online && cart.pendingSync === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative z-[55] border-b border-[var(--lx-gold)]/20 bg-[var(--lx-gold)]/[0.08] px-3 py-2 text-[var(--lx-text)]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center text-[10px] sm:text-[11px]">
        {online ? (
          <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--lx-gold)]" aria-hidden />
        ) : (
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-[var(--lx-gold)]" aria-hidden />
        )}
        <p className="text-[var(--lx-text)]/75">
          {online
            ? `Back online — syncing ${cart.pendingSync} bag ${cart.pendingSync === 1 ? "change" : "changes"} with the atelier.`
            : "Offline mode. Browsing and your bag still work; changes sync when you reconnect."}
        </p>
        {online && cart.pendingSync > 0 ? (
          <button
            type="button"
            onClick={() => void cart.flushPending()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--lx-gold)]/30 px-2 py-0.5 font-medium text-[var(--lx-gold)] transition hover:bg-[var(--lx-gold)]/10"
          >
            <CloudOff className="h-3 w-3" aria-hidden />
            Sync now
          </button>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Loader2, ShoppingBag, WifiOff } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function OfflineCartPreview() {
  const cart = useCart();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
          <ShoppingBag className="h-4 w-4 text-[var(--lx-gold)]" aria-hidden />
          Your saved bag
        </p>
        <span className="font-mono text-[10px] text-white/40">
          {cart.count} {cart.count === 1 ? "piece" : "pieces"}
        </span>
      </div>

      {cart.loading && cart.items.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-white/45">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Reading the local mirror…
        </p>
      ) : cart.items.length ? (
        <>
          <ul className="mt-4 space-y-2.5">
            {cart.items.slice(0, 4).map((item) => (
              <li key={`${item.productId}-${item.size ?? ""}-${item.color ?? ""}`} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-white/75">
                  {item.quantity} × {item.name}
                </span>
                <span className="shrink-0 font-mono text-[var(--lx-gold)]">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-white/45">Subtotal</span>
            <span className="font-semibold text-white">${cart.subtotal.toFixed(2)}</span>
          </div>
          <Link
            href="/cart"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lx-cyan)] hover:underline"
          >
            Open the full bag
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </>
      ) : (
        <p className="mt-4 text-xs leading-5 text-white/45">
          There is no locally saved bag yet. Browse the atelier when you reconnect, or add something on this
          device and MECO will keep it here.
        </p>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-4 text-white/30">
        <WifiOff className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        Changes are stored on this device and synced to the atelier when the connection returns.
      </p>
    </div>
  );
}

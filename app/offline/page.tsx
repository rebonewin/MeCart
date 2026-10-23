import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, WifiOff } from "lucide-react";
import { OfflineCartPreview } from "@/components/pwa/offline-cart-preview";
import { OfflineRetryButton } from "@/components/pwa/offline-retry-button";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Offline | MeCart",
  description: "The MeCart atelier, kept close even when the connection drops.",
};

export default function OfflinePage() {
  return (
    <div className="lx-dark-scene min-h-screen bg-[#05060e] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-lg">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--lx-cyan)]">
          MeCart · offline atelier
        </p>
        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--lx-gold)]/25 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]">
          <WifiOff className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">
          The atelier is <span className="lx-serif text-[var(--lx-gold)]">between signals</span>.
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          This page is cached on your device. Your bag, recently viewed pieces and saved browsing remain
          available locally; cart changes will sync as soon as you reconnect.
        </p>

        <div className="mt-7">
          <OfflineCartPreview />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <OfflineRetryButton />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white/65 transition hover:border-white/30 hover:text-white"
          >
            Go to the storefront
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <p className="mt-8 border-t border-white/10 pt-4 text-[10px] text-white/25">
          MeCart PWA · cached pages, local bag and background sync.
        </p>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function OfflineRetryButton() {
  return (
    <Button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 rounded-full bg-[var(--lx-gold)] px-4 py-2 text-xs font-semibold text-[#17120a] transition hover:bg-[var(--lx-gold-soft)]"
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
      Try again
    </Button>
  );
}

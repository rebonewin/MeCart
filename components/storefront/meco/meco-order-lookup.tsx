"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, PackageSearch, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lookupMyOrder, type MecoOrderLookup as LookupResult } from "@/lib/actions/meco";
import { deriveTracking } from "@/lib/tracking";

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function MecoOrderLookup({
  onClose,
  initialOrderNumber,
}: {
  onClose: () => void;
  initialOrderNumber?: string;
}) {
  const [value, setValue] = useState(initialOrderNumber ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<LookupResult | null>(null);
  const lastAutoRun = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runLookup = useCallback(async (raw: string) => {
    const clean = raw.trim();
    if (!clean) return;
    setStatus("loading");
    setResult(null);
    try {
      const next = await lookupMyOrder(clean);
      setResult(next);
    } catch {
      setResult({ ok: false, reason: "unavailable" });
    } finally {
      setStatus("done");
    }
  }, []);

  useEffect(() => {
    const clean = initialOrderNumber?.trim();
    if (!clean || lastAutoRun.current === clean) return;
    lastAutoRun.current = clean;
    setValue(clean);
    void runLookup(clean);
  }, [initialOrderNumber, runLookup]);

  useEffect(() => {
    if (initialOrderNumber) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [initialOrderNumber]);

  return (
    <div className="ml-8 rounded-2xl border border-[var(--lx-cyan)]/20 bg-[var(--lx-cyan)]/[0.055] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--lx-cyan)]">
            <PackageSearch className="h-3.5 w-3.5" aria-hidden />
            Secure order lookup
          </p>
          <p className="mt-0.5 text-[9px] text-[var(--lx-faint)]">
            Scoped to the signed-in account. No payment details are shown.
          </p>
        </div>
        <Button
          type="button"
          onClick={onClose}
          className="text-[var(--lx-faint)] transition hover:text-[var(--lx-text)]"
          aria-label="Close order lookup"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>

      <form
        className="mt-2 flex gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          void runLookup(value);
        }}
      >
        <label htmlFor="meco-order-number" className="sr-only">
          Order number
        </label>
        <input
          ref={inputRef}
          id="meco-order-number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ORD-20261022-100001"
          autoComplete="off"
          maxLength={40}
          className="min-w-0 flex-1 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface)] px-2.5 py-2 font-mono text-[10px] uppercase tracking-wide text-[var(--lx-text)] placeholder:text-[var(--lx-faint)] focus:border-[var(--lx-cyan)]/50 focus:outline-none"
        />
        <Button
          type="submit"
          disabled={status === "loading" || !value.trim()}
          className="flex h-8 items-center justify-center rounded-xl bg-[var(--lx-gold)] px-3 text-[10px] font-semibold text-[var(--lx-bg)] transition hover:bg-[var(--lx-gold-soft)] disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            "Find"
          )}
        </Button>
      </form>

      <div aria-live="polite">
        {result?.ok ? (
          <div className="mt-2 rounded-xl border border-[var(--lx-border)] bg-[var(--lx-surface)] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] text-[var(--lx-text)]">
                {result.order.orderNumber}
              </p>
              <span className="rounded-full bg-[var(--lx-emerald)]/15 px-2 py-0.5 text-[9px] font-medium text-[var(--lx-emerald)]">
                {deriveTracking(result.order).statusLabel}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--lx-muted)]">
              {statusLabel(result.order.paymentStatus)} · $
              {result.order.total.toFixed(2)} · updated{" "}
              {new Date(result.order.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
            <Link
              href={`/orders/${result.order.id}/track`}
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-[var(--lx-gold)] hover:underline"
            >
              Open live tracking
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        ) : null}

        {result && !result.ok ? (
          <p className="mt-2 text-[10px] leading-4 text-[var(--lx-muted)]" role="status">
            {result.reason === "auth" ? (
              <>
                Sign in to the account that placed the order, then ask me again.{" "}
                <Link href="/login" className="text-[var(--lx-gold)] hover:underline">
                  Sign in
                </Link>
              </>
            ) : result.reason === "not_found" ? (
              "I couldn't find that number on your account. Check the order confirmation, or open your orders."
            ) : result.reason === "invalid" ? (
              "That doesn't look like a MeCart order number. Use the format ORD-YYYYMMDD-######."
            ) : (
              "The order ledger is unavailable right now. Please try again in a moment."
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}

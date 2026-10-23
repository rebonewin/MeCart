"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, ScanSearch, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  fetchVisualCandidates,
} from "@/lib/ai/catalog-client";
import {
  searchVisually,
  visualSearchHasRemoteModel,
  visualSearchProviderLabel,
  type VisualAnalysis,
  type VisualCandidate,
  type VisualMatch,
} from "@/lib/ai/visual-search";

type SearchState = {
  matches: VisualMatch[];
  analysis: VisualAnalysis;
  provider: string;
  fellBack: boolean;
};

export function VisualSearchPanel({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const [candidates, setCandidates] = useState<VisualCandidate[]>([]);
  const [catalogueState, setCatalogueState] = useState<"loading" | "ready" | "error">("loading");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchState | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let active = true;
    fetchVisualCandidates()
      .then((next) => {
        if (!active) return;
        setCandidates(next);
        setCatalogueState("ready");
      })
      .catch(() => {
        if (active) setCatalogueState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const runSearch = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file to search by sight.");
      return;
    }
    const request = ++requestRef.current;
    setError(null);
    setBusy(true);
    setResult(null);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));

    try {
      let pool = candidates;
      if (!pool.length) {
        pool = await fetchVisualCandidates();
        setCandidates(pool);
        setCatalogueState("ready");
      }
      if (!pool.length) throw new Error("The live visual catalogue is unavailable right now.");
      const found = await searchVisually(file, pool);
      if (requestRef.current !== request) return;
      setResult(found);
    } catch (cause) {
      if (requestRef.current !== request) return;
      setError(cause instanceof Error ? cause.message : "Visual search could not complete.");
    } finally {
      if (requestRef.current === request) setBusy(false);
    }
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const providerLabel = result?.provider ?? visualSearchProviderLabel();

  return (
    <div className="p-2">
      <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
        <div>
          <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--lx-cyan)]">
            <ScanSearch className="h-3.5 w-3.5" aria-hidden /> Visual search
          </p>
          <p className="mt-1 text-sm text-white/75">Show MECO a texture, tone or silhouette.</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-white/55 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Text search
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void runSearch(file);
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void runSearch(file);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed transition",
          dragging
            ? "border-[var(--lx-cyan)]/70 bg-[var(--lx-cyan)]/10"
            : "border-white/15 bg-white/[0.025]",
        )}
      >
        {preview ? (
          <div className="relative aspect-[16/9]">
            <Image src={preview} alt={fileName ? `Uploaded image ${fileName}` : "Uploaded image"} fill unoptimized sizes="(max-width: 768px) 100vw, 720px" className="object-contain" />
            <button
              type="button"
              onClick={clear}
              aria-label="Remove uploaded image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#080a16]/80 text-white/70 backdrop-blur transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 px-6 py-8 text-center transition hover:bg-white/[0.03]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--lx-gold)]/25 bg-[var(--lx-gold)]/10 text-[var(--lx-gold)]">
              <ImagePlus className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-white">Drop an image, or choose one</span>
            <span className="max-w-sm text-xs leading-5 text-white/40">
              JPG, PNG or WebP. MECO reads palette, tone and catalogue affinity on this device.
            </span>
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="flex items-center gap-1.5 text-[10px] text-white/35">
          <Sparkles className="h-3 w-3 text-[var(--lx-cyan)]" aria-hidden />
          {providerLabel}
          {visualSearchHasRemoteModel() ? " · falls back on-device" : " · no external model required"}
        </p>
        {preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 text-[10px] text-[var(--lx-cyan)] transition hover:text-white"
          >
            <Upload className="h-3 w-3" aria-hidden /> Another image
          </button>
        ) : null}
      </div>

      <div className="min-h-10" aria-live="polite">
        {busy ? (
          <p className="flex items-center justify-center gap-2 py-6 text-xs text-white/50">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--lx-cyan)]" aria-hidden />
            Reading the image against the live catalogue…
          </p>
        ) : null}
        {error ? (
          <div className="mt-3 rounded-xl border border-[var(--lx-gold)]/20 bg-[var(--lx-gold)]/[0.07] px-3 py-2.5 text-xs leading-5 text-white/65">
            {error} You can still{" "}
            <button type="button" onClick={onClose} className="text-[var(--lx-cyan)] hover:underline">
              search by text
            </button>
            .
          </div>
        ) : null}
        {catalogueState === "error" && !error ? (
          <p className="mt-2 px-1 text-[10px] text-white/35">
            The visual catalogue is slow to load. You can still search by text.
          </p>
        ) : null}
      </div>

      {result ? (
        <div className="mt-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-medium text-white/80">
              {result.matches.length ? "Visually similar pieces" : "No close visual match"}
            </p>
            <span className="flex items-center gap-1">
              {result.analysis.palette.slice(0, 4).map((color, index) => (
                <span
                  key={`${color.r}-${color.g}-${color.b}-${index}`}
                  className="h-3 w-3 rounded-full border border-white/20"
                  style={{ backgroundColor: `rgb(${Math.round(color.r)} ${Math.round(color.g)} ${Math.round(color.b)})` }}
                  aria-hidden
                />
              ))}
            </span>
          </div>
          {result.fellBack ? (
            <p className="mt-1 px-1 text-[10px] text-[var(--lx-gold)]">
              The vision model was unavailable, so MECO used the on-device palette matcher.
            </p>
          ) : null}
          {result.matches.length ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {result.matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/products/${match.slug}`}
                  onClick={onNavigate}
                  className="group flex gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 transition hover:border-[var(--lx-gold)]/35 hover:bg-white/[0.06]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {match.image ? (
                      <Image src={match.image} alt={match.name} fill sizes="64px" className="object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-black text-white/30">
                        {match.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate text-[9px] uppercase tracking-[0.18em] text-white/40">{match.brandName}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-4 text-white">{match.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[var(--lx-gold)]">${match.price.toFixed(2)}</span>
                      <span className="text-[9px] text-[var(--lx-cyan)]">{match.confidence}% match</span>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] text-white/35">{match.reason}</p>
                  </div>
                  <ArrowRight className="mt-5 h-3.5 w-3.5 shrink-0 text-white/25 transition group-hover:text-[var(--lx-gold)]" aria-hidden />
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center">
              <p className="text-xs text-white/60">Nothing in the edit shares that palette closely enough.</p>
              <button type="button" onClick={onClose} className="mt-1 text-[10px] text-[var(--lx-cyan)] hover:underline">
                Try a text search instead
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Reserves space for a below-the-fold section and only mounts it when it is
 * close to the viewport. This keeps long client sections out of the initial
 * hydration path without introducing layout shift.
 */
export function LazySection({
  children,
  minHeight = 420,
  className,
  id,
  rootMargin = "520px 0px",
  label = "Loading section",
}: {
  children: ReactNode;
  minHeight?: number;
  className?: string;
  id?: string;
  rootMargin?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      id={id}
      className={cn("relative", className)}
      style={visible ? undefined : { minHeight }}
      data-lazy-section={visible ? "loaded" : "pending"}
    >
      {visible ? (
        children
      ) : (
        <div
          role="status"
          aria-label={label}
          className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--lx-border)]" />
          <div className="h-8 w-72 max-w-full animate-pulse rounded-full bg-[var(--lx-border)]" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-surface-2)]/60"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

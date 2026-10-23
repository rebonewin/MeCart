"use client";

import { useEffect } from "react";

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/**
 * Registers the custom service worker after first paint. Disabled in development
 * so hot reloading is never served from the production cache.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const idleWindow = window as IdleWindow;
    let cancelled = false;

    const register = () => {
      if (cancelled) return;
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Offline support is progressive; the storefront still works.
        });
    };

    const schedule = () => {
      if (cancelled) return;
      if (idleWindow.requestIdleCallback) idleWindow.requestIdleCallback(register, { timeout: 5000 });
      else window.setTimeout(register, 4000);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, []);

  return null;
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MecoAssistant = dynamic(
  () => import("./meco-assistant").then((module) => module.MecoAssistant),
  { ssr: false },
);

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * The assistant is intentionally kept out of the first paint. It mounts once the
 * browser is idle, or immediately on the shopper's first interaction, then stays
 * mounted across client-side navigation.
 */
export function MecoAssistantMount() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idleWindow = window as IdleWindow;
    let idleHandle: number | undefined;
    let timeout: number | undefined;
    let done = false;

    const cleanup = () => {
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeout !== undefined) window.clearTimeout(timeout);
      for (const event of ["pointerdown", "keydown", "scroll", "touchstart"] as const) {
        window.removeEventListener(event, mount);
      }
    };

    const mount = () => {
      if (done) return;
      done = true;
      cleanup();
      setReady(true);
    };

    for (const event of ["pointerdown", "keydown", "scroll", "touchstart"] as const) {
      window.addEventListener(event, mount, { passive: true, once: true });
    }

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(mount, { timeout: 2400 });
    } else {
      timeout = window.setTimeout(mount, 2200);
    }

    return () => {
      done = true;
      cleanup();
    };
  }, []);

  return ready ? <MecoAssistant /> : null;
}

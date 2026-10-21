"use client";

import { useEffect, useState } from "react";
import { gsap } from "gsap";

/**
 * TimelineManager — a single owner for every GSAP timeline in a component
 * subtree. Nothing creates a bare `gsap.timeline()`; everything is registered
 * here so a single `killAll()` tears the whole motion system down cleanly.
 */
export class TimelineManager {
  private readonly timelines = new Set<gsap.core.Timeline>();

  timeline(vars?: gsap.TimelineVars): gsap.core.Timeline {
    const originalComplete = vars?.onComplete;
    const originalInterrupt = vars?.onInterrupt;

    const tl = gsap.timeline({
      ...vars,
      onComplete: (...args: unknown[]) => {
        this.timelines.delete(tl);
        (originalComplete as ((...a: unknown[]) => void) | undefined)?.(...args);
      },
      onInterrupt: (...args: unknown[]) => {
        this.timelines.delete(tl);
        (originalInterrupt as ((...a: unknown[]) => void) | undefined)?.(...args);
      },
    });

    this.timelines.add(tl);
    return tl;
  }

  killAll(): void {
    for (const tl of this.timelines) tl.kill();
    this.timelines.clear();
  }
}

/** A manager scoped to a component, auto-torn-down on unmount. */
export function useTimelineManager(): TimelineManager {
  const [manager] = useState(() => new TimelineManager());
  useEffect(() => () => manager.killAll(), [manager]);
  return manager;
}

export { gsap };

/**
 * intro.ts — a tiny completion signal for the first-visit sequence.
 *
 * The loading screen and the MECO arrival are two separate mount points, so
 * they need a deterministic hand-off. The loader marks the intro complete on
 * exit; the arrival subscribes and starts afterwards, even if it mounted
 * later than the loader.
 */

let complete = false;
const listeners = new Set<() => void>();

export function completeIntro(): void {
  if (complete) return;
  complete = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

export function onIntroComplete(callback: () => void): () => void {
  if (complete) {
    callback();
    return () => {};
  }
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

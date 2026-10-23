"use client";

export type GsapRuntime = typeof import("gsap").gsap;

let pending: Promise<GsapRuntime> | null = null;

/** Load GSAP only when a parcel flight actually needs it. */
export function loadGsap(): Promise<GsapRuntime> {
  if (!pending) {
    pending = import("gsap")
      .then((module) => module.gsap)
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

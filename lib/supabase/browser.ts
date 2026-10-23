"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let pending: Promise<SupabaseClient<Database>> | null = null;

/**
 * Load the Supabase browser SDK on demand. Keeping this import dynamic means
 * the ~250 KB SDK is not part of the first-paint bundle for guests who are
 * only browsing; it arrives when auth, cart or wishlist work actually starts.
 */
export function getSupabase(): Promise<SupabaseClient<Database>> {
  if (!pending) {
    pending = import("./client")
      .then((module) => module.createClient())
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

/**
 * Supabase SSR stores the session in a cookie. Checking for its presence lets
 * us skip the SDK entirely for first-time guests without hiding an existing
 * signed-in session.
 */
export function hasSupabaseSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((entry) => {
    const name = entry.trim().split("=")[0];
    return name.startsWith("sb-") && name.includes("-auth-token");
  });
}

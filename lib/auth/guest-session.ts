"use client";

import { getSupabase } from "@/lib/supabase/browser";

// A guest visit can mount the cart and wishlist providers at the same time;
// both must share one anonymous session instead of racing to create several.
let pendingGuestSession: Promise<string | null> | null = null;

/**
 * Ensure there is a signed-in session (anonymous for guests).
 * Returns the user id, or null when no session could be established.
 */
export async function ensureSession(): Promise<string | null> {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user.id;

  if (!pendingGuestSession) {
    const promise = (async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return null;
      return data.user.id;
    })();
    pendingGuestSession = promise;
    // Clear once settled so a later sign-out can create a fresh guest session.
    void promise.then(() => {
      if (pendingGuestSession === promise) pendingGuestSession = null;
    });
  }

  return pendingGuestSession;
}

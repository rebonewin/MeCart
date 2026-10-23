import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let publicClient: SupabaseClient<Database> | null = null;

/**
 * A cookieless, read-only Supabase client for public storefront data.
 *
 * `cookies()` is request-scoped and cannot be used inside `unstable_cache`.
 * This client deliberately has no session, so public catalogue reads can be
 * cached and shared safely across visitors while RLS still applies.
 */
export function getPublicSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
    );
  }

  if (!publicClient) {
    publicClient = createClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { "X-Client-Info": "mecart-storefront-public" },
      },
    });
  }

  return publicClient;
}

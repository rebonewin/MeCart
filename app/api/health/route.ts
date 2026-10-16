import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAIL",
] as const;

export async function GET() {
  const env = KEYS.map((key) => ({ key, present: Boolean(process.env[key]) }));

  let dbProbe = "skipped (missing env)";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const client = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await client.from("profiles").select("id", { count: "exact", head: true });
      dbProbe = error ? `error: ${error.message}` : "ok";
    } catch (err) {
      dbProbe = `thrown: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({ env, dbProbe }, { headers: { "Cache-Control": "no-store" } });
}
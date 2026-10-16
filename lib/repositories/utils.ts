import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type DB = SupabaseClient<Database>;

type ResponseLike = { data: unknown; error: PostgrestError | null };

export function unwrap<R extends ResponseLike>(result: R): NonNullable<R["data"]> {
  if (result.error) throw new Error(result.error.message);
  const data = result.data;
  if (data === null || data === undefined) throw new Error("Not found");
  return data as NonNullable<R["data"]>;
}

export function unwrapList<R extends ResponseLike>(result: R): NonNullable<R["data"]> & unknown[] {
  if (result.error) throw new Error(result.error.message);
  return ((result.data ?? []) as unknown) as NonNullable<R["data"]> & unknown[];
}

export function unwrapMaybe<R extends ResponseLike>(result: R): R["data"] | null {
  if (result.error) return null;
  return (result.data ?? null) as R["data"] | null;
}

export function unwrapVoid(result: { error: PostgrestError | null }) {
  if (result.error) throw new Error(result.error.message);
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function nowIso() {
  return new Date().toISOString();
}

/**
 * PostgREST-safe equality for nullable text columns:
 * uses `is null` when the value is null/undefined instead of `eq null`.
 */
export function nullableEq<Q extends { eq: (...args: never[]) => unknown; is: (...args: never[]) => unknown }>(
  query: Q,
  column: string,
  value: string | null | undefined,
): Q {
  const anyQuery = query as unknown as {
    eq: (column: string, value: string) => unknown;
    is: (column: string, value: null) => unknown;
  };
  return (value == null ? anyQuery.is(column, null) : anyQuery.eq(column, value)) as Q;
}

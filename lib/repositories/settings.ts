import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { Json, SettingRow, ThemeSettingRow } from "@/types/database";

export async function getSettings(): Promise<Record<string, Json>> {
  const supabase = await createClient();
  const rows = unwrapList(await supabase.from("settings").select("*"));
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getSetting<T = Json>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? fallback;
}

export async function setSetting(key: string, value: Json, isPublic?: boolean) {
  const supabase = await createClient();
  const patch: { value: Json; is_public?: boolean } = { value };
  if (isPublic !== undefined) patch.is_public = isPublic;
  unwrapVoid(await supabase.from("settings").upsert({ key, value, ...(isPublic !== undefined ? { is_public: isPublic } : {}) }, { onConflict: "key" }));
}

export async function listSettingsRaw(): Promise<SettingRow[]> {
  const supabase = await createClient();
  return unwrapList(await supabase.from("settings").select("*").order("key"));
}

export async function getThemeSettings(): Promise<Record<string, Json>> {
  const supabase = await createClient();
  const rows = unwrapList(await supabase.from("theme_settings").select("*"));
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function getThemeSetting<T = Json>(key: string, fallback: T): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.from("theme_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? fallback;
}

export async function setThemeSetting(key: string, value: Json) {
  const supabase = await createClient();
  unwrapVoid(await supabase.from("theme_settings").upsert({ key, value }, { onConflict: "key" }));
}

export async function listThemeSettingsRaw(): Promise<ThemeSettingRow[]> {
  const supabase = await createClient();
  return unwrapList(await supabase.from("theme_settings").select("*").order("key"));
}

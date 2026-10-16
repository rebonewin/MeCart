"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/security/audit";
import { getSettings, setSetting } from "@/lib/repositories/settings";
import type { Json } from "@/types/database";

export type SettingScalar = string | number | boolean;
export type SettingEntry = { key: string; value: SettingScalar };

const KEY_PATTERN = /^[A-Za-z0-9_.-]+$/;

/**
 * Coerce a form value while preserving the JSON type of the existing setting.
 * Booleans stay booleans, numbers stay numbers, arrays stay arrays — only
 * unknown/new keys trust the caller's literal type.
 */
function coerceValue(key: string, raw: SettingScalar, existing: Json | undefined): Json {
  if (typeof existing === "boolean") {
    if (typeof raw === "boolean") return raw;
    return raw === "true" || raw === "1" || raw === 1;
  }
  if (typeof existing === "number") {
    const parsed = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(parsed)) throw new Error(`Enter a valid number for "${key}"`);
    return parsed;
  }
  if (Array.isArray(existing)) {
    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return [raw];
  }
  if (typeof existing === "string") {
    return typeof raw === "string" ? raw : String(raw);
  }
  return raw;
}

function getLeaf(value: Json | undefined, path: string[]): Json | undefined {
  let current: Json | undefined = value;
  for (const part of path) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) return undefined;
    current = current[part];
  }
  return current;
}

function setLeaf(base: Json | undefined, path: string[], value: Json): Json {
  if (!path.length) return value;
  const root: { [key: string]: Json | undefined } =
    typeof base === "object" && base !== null && !Array.isArray(base) ? { ...base } : {};
  let cursor = root;
  path.forEach((part, index) => {
    if (index === path.length - 1) {
      cursor[part] = value;
      return;
    }
    const next = cursor[part];
    const branch: { [key: string]: Json | undefined } =
      typeof next === "object" && next !== null && !Array.isArray(next) ? { ...next } : {};
    cursor[part] = branch;
    cursor = branch;
  });
  return root;
}

async function applyEntries(entries: SettingEntry[]) {
  await requireAdmin();

  const clean = entries
    .map((entry) => ({ key: entry.key.trim(), value: entry.value }))
    .filter((entry) => entry.key.length > 0);
  if (!clean.length) return;

  for (const entry of clean) {
    if (!KEY_PATTERN.test(entry.key)) throw new Error(`Invalid setting key "${entry.key}"`);
  }

  const settings = await getSettings();
  const merged = new Map<string, Json>();

  for (const entry of clean) {
    const [root, ...path] = entry.key.split(".");
    if (!root) continue;
    const current: Json | undefined = merged.has(root) ? merged.get(root) : settings[root];
    const coerced = coerceValue(entry.key, entry.value, getLeaf(current, path));
    merged.set(root, setLeaf(current, path, coerced));
  }

  for (const [key, value] of merged) {
    await setSetting(key, value);
  }

  await logAudit({
    action: "UPDATE_SETTINGS",
    resource: "Settings",
    newValue: clean.map((entry) => entry.key).join(", "),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

/** Save a single setting. Dotted keys patch nested JSON fields (e.g. `store.name`). */
export async function saveSettingAction(key: string, value: SettingScalar) {
  await applyEntries([{ key, value }]);
}

/** Save every field on a settings group in one round-trip. */
export async function saveBulkSettingsAction(entries: SettingEntry[]) {
  await applyEntries(entries);
}

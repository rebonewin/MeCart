"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { getThemeSetting, setThemeSetting } from "@/lib/repositories/settings";
import { defaultTheme, isThemeTokens, toThemeVersions, type ThemeTokens, type ThemeVersion } from "@/lib/theme";
import type { Json } from "@/types/database";

async function persistTokens(tokens: ThemeTokens): Promise<void> {
  await setThemeSetting("tokens", tokens as unknown as Json);
  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
}

export async function saveThemeAction(tokens: ThemeTokens): Promise<void> {
  await requireStaff();
  if (!isThemeTokens(tokens)) throw new Error("Invalid theme tokens");
  await persistTokens(tokens);
}

export async function publishThemeAction(tokens: ThemeTokens): Promise<ThemeVersion> {
  await requireStaff();
  if (!isThemeTokens(tokens)) throw new Error("Invalid theme tokens");

  const existing = toThemeVersions(await getThemeSetting<Json>("versions", []));
  const version: ThemeVersion = {
    id: `version-${Date.now()}`,
    name: `Published ${new Date().toLocaleString()}`,
    createdAt: new Date().toISOString(),
    tokens,
  };

  await persistTokens(tokens);
  await setThemeSetting("versions", [version, ...existing].slice(0, 12) as unknown as Json);

  return version;
}

export async function resetThemeAction(): Promise<void> {
  await requireStaff();
  await persistTokens(defaultTheme);
}

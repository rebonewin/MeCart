import "server-only";
import { getThemeSetting } from "@/lib/repositories/settings";
import { defaultTheme, isThemeTokens, toThemeVersions, type ThemeTokens, type ThemeVersion } from "@/lib/theme";

export async function getActiveTheme(): Promise<ThemeTokens> {
  const value = await getThemeSetting<unknown>("tokens", null);
  return isThemeTokens(value) ? value : defaultTheme;
}

export async function getThemeVersions(): Promise<ThemeVersion[]> {
  const value = await getThemeSetting<unknown>("versions", []);
  return toThemeVersions(value);
}

export async function loadThemeEditorData(): Promise<{ initial: ThemeTokens; initialVersions: ThemeVersion[] }> {
  const [initial, initialVersions] = await Promise.all([getActiveTheme(), getThemeVersions()]);
  return { initial, initialVersions };
}

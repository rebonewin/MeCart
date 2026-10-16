import { ThemeEditor } from "@/components/theme/ThemeEditor";
import { loadThemeEditorData } from "@/lib/repositories/theme";

export const dynamic = "force-dynamic";

export default async function ThemeEditorPage() {
  const { initial, initialVersions } = await loadThemeEditorData();
  return <ThemeEditor initial={initial} initialVersions={initialVersions} initialTab="colors" />;
}

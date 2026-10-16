import { ThemeEditor } from "@/components/theme/ThemeEditor";
import { loadThemeEditorData } from "@/lib/repositories/theme";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const { initial, initialVersions } = await loadThemeEditorData();
  return (
    <div className="relative">
      <ThemeEditor initial={initial} initialVersions={initialVersions} initialTab="colors" />
    </div>
  );
}

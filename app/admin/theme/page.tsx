import { ThemeEditor } from "@/components/theme/ThemeEditor";

export default function ThemePage() {
  return (
    <div className="relative">
      <ThemeEditor initialTab="colors" />
    </div>
  );
}

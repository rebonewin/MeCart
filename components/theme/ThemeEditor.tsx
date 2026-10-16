"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, Eye, History, Monitor, Palette, Redo2, RotateCcw, Save, Smartphone, Square, Tablet, Undo2, Upload, WandSparkles } from "lucide-react";
import { defaultTheme, isThemeTokens, presetThemes, varsForTheme, type ThemeTokens, type ThemeVersion } from "@/lib/theme";
import { publishThemeAction, resetThemeAction, saveThemeAction } from "@/lib/actions/theme";

const colorKeys = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "card",
  "header",
  "footer",
  "text",
  "muted",
  "border",
] as const;

const fontOptions = ["Inter, system-ui, sans-serif", "Outfit, sans-serif", "Space Grotesk, sans-serif", "Poppins, sans-serif", "system-ui, sans-serif"];

const radiusOptions = ["0.75rem", "1rem", "1.25rem", "1.5rem", "2rem"];
const shadowOptions = ["0 10px 30px rgba(0,0,0,0.15)", "0 20px 60px rgba(2,8,23,0.35)", "0 30px 80px rgba(2,8,23,0.45)"];

export function ThemeEditor({ initial, initialVersions = [], initialTab = "colors" }: { initial: ThemeTokens; initialVersions?: ThemeVersion[]; initialTab?: string }) {
  const [theme, setTheme] = useState(initial);
  const [history, setHistory] = useState<ThemeTokens[]>([]);
  const [future, setFuture] = useState<ThemeTokens[]>([]);
  const [active, setActive] = useState(initialTab);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [savedVersions, setSavedVersions] = useState<ThemeVersion[]>(initialVersions);
  const [selectedPreset, setSelectedPreset] = useState("Luxury Dark");
  const [pending, startTransition] = useTransition();
  const importRef = useRef<HTMLInputElement>(null);

  const pushHistory = useCallback((next: ThemeTokens) => {
    setHistory((previous) => [...previous.slice(-19), JSON.parse(JSON.stringify(theme))]);
    setFuture([]);
    setTheme(next);
  }, [theme]);

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setFuture((items) => [JSON.parse(JSON.stringify(theme)), ...items]);
    setHistory(newHistory);
    setTheme(previous);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((items) => [...items, JSON.parse(JSON.stringify(theme))]);
    setFuture((items) => items.slice(1));
    setTheme(next);
  };

  const vars = useMemo(() => varsForTheme(theme), [theme]);

  const previewWidth = viewport === "mobile" ? "390px" : viewport === "tablet" ? "768px" : "100%";

  const saveNow = () => {
    startTransition(async () => {
      try {
        await saveThemeAction(theme);
        toast.success("Theme saved");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save theme");
      }
    });
  };

  const publish = () => {
    startTransition(async () => {
      try {
        const version = await publishThemeAction(theme);
        setSavedVersions((versions) => [version, ...versions].slice(0, 12));
        toast.success("Theme published");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to publish theme");
      }
    });
  };

  const reset = () => {
    startTransition(async () => {
      try {
        await resetThemeAction();
        setHistory([]);
        setFuture([]);
        setTheme(defaultTheme);
        toast.success("Theme reset to defaults");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reset theme");
      }
    });
  };

  const exportTheme = () => {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mecart-theme.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isThemeTokens(parsed)) throw new Error("The selected file is not a valid theme");
      pushHistory(parsed);
      toast.success("Theme imported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import theme");
    }
  };

  const tabs = [
    { id: "colors", label: "Colors", icon: Palette },
    { id: "typography", label: "Typography", icon: Square },
    { id: "layout", label: "Layout", icon: Undo2 },
    { id: "presets", label: "Presets", icon: WandSparkles },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-8 shadow-2xl">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart Theme Studio</p>
            <h1 className="mt-3 text-4xl font-black text-white">Theme Customizer</h1>
            <p className="mt-2 text-sm text-slate-300">Build, preview, and publish enterprise themes without touching backend logic.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={undo} disabled={!history.length} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">
              <Undo2 className="mr-2 inline h-4 w-4" /> Undo
            </button>
            <button onClick={redo} disabled={!future.length} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">
              <Redo2 className="mr-2 inline h-4 w-4" /> Redo
            </button>
            <button onClick={reset} disabled={pending} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">
              <RotateCcw className="mr-2 inline h-4 w-4" /> Reset
            </button>
            <button onClick={saveNow} disabled={pending} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50">
              <Save className="mr-2 inline h-4 w-4" /> Save Draft
            </button>
            <button onClick={publish} disabled={pending} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-blue-600/20 disabled:opacity-50">
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${active === tab.id ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
        <button onClick={() => setViewport("desktop")} className={`rounded-full border px-3 py-2 ${viewport === "desktop" ? "border-blue-400 text-blue-300" : "border-white/10 text-slate-400"}`}><Monitor className="h-4 w-4" /></button>
        <button onClick={() => setViewport("tablet")} className={`rounded-full border px-3 py-2 ${viewport === "tablet" ? "border-blue-400 text-blue-300" : "border-white/10 text-slate-400"}`}><Tablet className="h-4 w-4" /></button>
        <button onClick={() => setViewport("mobile")} className={`rounded-full border px-3 py-2 ${viewport === "mobile" ? "border-blue-400 text-blue-300" : "border-white/10 text-slate-400"}`}><Smartphone className="h-4 w-4" /></button>
        <button onClick={exportTheme} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
          <Download className="mr-2 inline h-4 w-4" /> Export
        </button>
        <label className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10">
          <Upload className="mr-2 inline h-4 w-4" /> Import
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importTheme(file);
            event.target.value = "";
          }} />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className="space-y-4">
          {active === "colors" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-white">Color System</h2>
              <div className="space-y-3">
                {colorKeys.map((key) => (
                  <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span className="text-sm font-medium text-slate-200">{key}</span>
                    <input
                      type="color"
                      value={theme.colors[key as keyof typeof theme.colors]?.startsWith("#") ? theme.colors[key as keyof typeof theme.colors] : "#2563EB"}
                      onChange={(event) => pushHistory({ ...theme, colors: { ...theme.colors, [key]: event.target.value } })}
                      className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {active === "typography" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-white">Typography</h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Heading Font</span>
                  <select value={theme.typography.headingFont} onChange={(event) => pushHistory({ ...theme, typography: { ...theme.typography, headingFont: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Body Font</span>
                  <select value={theme.typography.bodyFont} onChange={(event) => pushHistory({ ...theme, typography: { ...theme.typography, bodyFont: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Heading Size</span>
                  <input value={theme.typography.headingSize} onChange={(event) => pushHistory({ ...theme, typography: { ...theme.typography, headingSize: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Letter Spacing</span>
                  <input value={theme.typography.letterSpacing} onChange={(event) => pushHistory({ ...theme, typography: { ...theme.typography, letterSpacing: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white" />
                </label>
              </div>
            </div>
          )}

          {active === "layout" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-white">Layout Settings</h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Border Radius</span>
                  <select value={theme.layout.radius} onChange={(event) => pushHistory({ ...theme, layout: { ...theme.layout, radius: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    {radiusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Shadow</span>
                  <select value={theme.layout.shadow} onChange={(event) => pushHistory({ ...theme, layout: { ...theme.layout, shadow: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    {shadowOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Animation Speed</span>
                  <input value={theme.layout.animationSpeed} onChange={(event) => pushHistory({ ...theme, layout: { ...theme.layout, animationSpeed: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Navbar Height</span>
                  <input value={theme.layout.navbarHeight} onChange={(event) => pushHistory({ ...theme, layout: { ...theme.layout, navbarHeight: event.target.value } })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white" />
                </label>
              </div>
            </div>
          )}

          {active === "presets" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-white">Preset Themes</h2>
              <div className="space-y-2">
                {Object.keys(presetThemes).map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSelectedPreset(name); pushHistory(presetThemes[name]); }}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedPreset === name ? "border-blue-400/60 bg-blue-500/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{name}</span>
                      <WandSparkles className="h-4 w-4 text-blue-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "history" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-bold text-white">Version History</h2>
              {savedVersions.length === 0 && <p className="text-sm text-slate-400">No published versions yet.</p>}
              <div className="space-y-3">
                {savedVersions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => pushHistory(version.tokens)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.08]"
                  >
                    <p className="font-semibold text-white">{version.name}</p>
                    <p className="text-xs text-slate-400">{new Date(version.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Live Preview</h2>
              <p className="text-sm text-slate-400">{viewport} view</p>
            </div>
            <Eye className="h-5 w-5 text-blue-300" />
          </div>

          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/40 shadow-2xl transition-all duration-500"
              style={{ width: previewWidth, maxWidth: "100%" }}
            >
              <div className="min-h-[640px]" style={vars as React.CSSProperties}>
                <div
                  className="p-6"
                  style={{
                    background: vars["--theme-bg"],
                    color: vars["--theme-text"],
                    fontFamily: vars["--theme-body-font"],
                    lineHeight: vars["--theme-line-height"],
                    letterSpacing: vars["--theme-letter-spacing"],
                  }}
                >
                  <header
                    className="mb-6 flex items-center justify-between px-5 py-4"
                    style={{ background: vars["--theme-header"], border: `1px solid ${vars["--theme-border"]}`, borderRadius: vars["--theme-radius"] }}
                  >
                    <span style={{ fontFamily: vars["--theme-heading-font"], fontSize: "1.25rem", fontWeight: 800 }}>MeCart</span>
                    <span className="text-sm" style={{ color: vars["--theme-muted"] }}>Shop • Categories • Deals</span>
                  </header>

                  <main className="space-y-5 px-5">
                    <section
                      className="p-8 text-center"
                      style={{
                        background: vars["--theme-button"],
                        color: "#fff",
                        borderRadius: vars["--theme-radius"],
                        boxShadow: vars["--theme-shadow"],
                      }}
                    >
                      <h2 style={{ fontFamily: vars["--theme-heading-font"], fontSize: "2.25rem", fontWeight: 900, lineHeight: 1.1 }}>Future Shopping Experience</h2>
                      <p className="mt-3" style={{ color: "rgba(255,255,255,0.85)" }}>Premium products and modern design in one beautiful storefront.</p>
                      <button className="mt-5 rounded-full bg-white px-6 py-3 text-sm font-bold" style={{ borderRadius: vars["--theme-radius"], color: "#0f172a", fontFamily: vars["--theme-button-font"] }}>
                        Shop Now
                      </button>
                    </section>

                    <section
                      className="p-6"
                      style={{ background: vars["--theme-card"], border: `1px solid ${vars["--theme-border"]}`, borderRadius: vars["--theme-radius"], boxShadow: vars["--theme-shadow"] }}
                    >
                      <h3 style={{ fontFamily: vars["--theme-heading-font"], textAlign: "center" }}>Featured Products</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((item) => (
                          <div key={item} className="p-4" style={{ background: vars["--theme-surface"], border: `1px solid ${vars["--theme-border"]}`, borderRadius: vars["--theme-radius"] }}>
                            <div className="mb-3 aspect-square rounded-xl" style={{ background: vars["--theme-muted"] }} />
                            <p className="font-semibold">Premium Item {item}</p>
                            <p style={{ color: vars["--theme-muted"] }}>$129.00</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </main>

                  <footer
                    className="mt-6 px-5 py-4 text-center text-sm"
                    style={{ background: vars["--theme-footer"], border: `1px solid ${vars["--theme-border"]}`, borderRadius: vars["--theme-radius"], color: vars["--theme-muted"] }}
                  >
                    © 2026 MeCart. All rights reserved.
                  </footer>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            This preview renders with the selected design tokens. Save a version to restore it later.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Copy, LayoutTemplate, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { deleteCmsPageAction, saveCmsPageAction } from "@/lib/actions/cms";
import type { CmsStatus } from "@/types/database";

export type SectionType = "hero" | "feature-grid" | "newsletter" | "faq" | "product-grid" | "cta";

export type CmsSection = {
  id: string;
  type: SectionType;
  title: string;
  subtitle: string;
  align: "left" | "center";
  theme: "light" | "dark" | "gradient";
  visible: boolean;
};

export type CmsPageData = {
  id: string;
  title: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
  sections: CmsSection[];
};

const sectionPresets: Record<SectionType, Omit<CmsSection, "id">> = {
  hero: { type: "hero", title: "Future Shopping Experience", subtitle: "Premium products, modern design, and AI-powered discovery.", align: "center", theme: "gradient", visible: true },
  "feature-grid": { type: "feature-grid", title: "Why MeCart", subtitle: "Fast delivery, secure payments, easy returns, and 24/7 support.", align: "center", theme: "dark", visible: true },
  newsletter: { type: "newsletter", title: "Stay in the Loop", subtitle: "Get launch updates and private offers.", align: "center", theme: "dark", visible: true },
  faq: { type: "faq", title: "Frequently Asked Questions", subtitle: "Everything shoppers need to know.", align: "left", theme: "dark", visible: true },
  "product-grid": { type: "product-grid", title: "Featured Products", subtitle: "Curated premium collections.", align: "center", theme: "dark", visible: true },
  cta: { type: "cta", title: "Start Shopping", subtitle: "Discover the MeCart difference today.", align: "center", theme: "gradient", visible: true },
};

const templateSets: Record<string, CmsSection[]> = {
  Fashion: [
    { id: "f1", ...sectionPresets.hero, title: "Fashion Forward Collection", theme: "gradient" },
    { id: "f2", ...sectionPresets["product-grid"], title: "New Arrivals", theme: "dark" },
    { id: "f3", ...sectionPresets.cta, title: "Shop the Look", theme: "gradient" },
  ],
  Electronics: [
    { id: "e1", ...sectionPresets.hero, title: "Technology That Inspires", theme: "gradient" },
    { id: "e2", ...sectionPresets["feature-grid"], title: "Why Choose Our Tech", theme: "dark" },
    { id: "e3", ...sectionPresets.newsletter, title: "Tech Updates", theme: "dark" },
  ],
  Luxury: [
    { id: "l1", ...sectionPresets.hero, title: "Luxury Redefined", theme: "gradient" },
    { id: "l2", ...sectionPresets.cta, title: "Explore Collections", theme: "gradient" },
  ],
};

function toDbStatus(status: CmsPageData["status"]): CmsStatus {
  if (status === "Published") return "PUBLISHED";
  if (status === "Archived") return "ARCHIVED";
  return "DRAFT";
}

function SectionPreview({ section }: { section: CmsSection }) {
  const theme = section.theme === "gradient" ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white" : section.theme === "light" ? "bg-white text-slate-900" : "bg-slate-900/60 text-white";
  if (section.type === "hero") {
    return <div className={`rounded-2xl p-8 ${theme}`}><h3 className={`text-2xl font-black ${section.align === "center" ? "text-center" : "text-left"}`}>{section.title}</h3><p className={`mt-2 ${section.align === "center" ? "text-center" : "text-left"} text-sm opacity-85`}>{section.subtitle}</p></div>;
  }
  if (section.type === "feature-grid") {
    return <div className={`rounded-2xl p-8 ${theme}`}><h3 className={`text-xl font-bold ${section.align === "center" ? "text-center" : "text-left"}`}>{section.title}</h3><p className={`mt-2 text-sm opacity-85 ${section.align === "center" ? "text-center" : "text-left"}`}>{section.subtitle}</p></div>;
  }
  if (section.type === "newsletter") {
    return <div className={`rounded-2xl p-8 ${theme}`}><h3 className={`text-xl font-bold ${section.align === "center" ? "text-center" : "text-left"}`}>{section.title}</h3><p className={`mt-2 text-sm opacity-85 ${section.align === "center" ? "text-center" : "text-left"}`}>{section.subtitle}</p></div>;
  }
  if (section.type === "faq") {
    return <div className={`rounded-2xl p-8 ${theme}`}><h3 className="text-xl font-bold">{section.title}</h3><p className={`mt-2 text-sm opacity-85`}>{section.subtitle}</p></div>;
  }
  if (section.type === "product-grid") {
    return <div className={`rounded-2xl p-8 ${theme}`}><h3 className={`text-xl font-bold ${section.align === "center" ? "text-center" : "text-left"}`}>{section.title}</h3><p className={`mt-2 text-sm opacity-85 ${section.align === "center" ? "text-center" : "text-left"}`}>{section.subtitle}</p></div>;
  }
  return <div className={`rounded-2xl p-8 ${theme}`}><h3 className="text-xl font-bold">{section.title}</h3><p className="mt-2 text-sm opacity-85">{section.subtitle}</p></div>;
}

export function CmsBuilder({ initialPages }: { initialPages: CmsPageData[] }) {
  const router = useRouter();
  const [pages, setPages] = useState<CmsPageData[]>(initialPages);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id ?? null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [template, setTemplate] = useState("Fashion");
  const [pending, startTransition] = useTransition();

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) ?? pages[0] ?? null, [pages, selectedPageId]);
  const selectedSection = useMemo(() => (selectedPage ? selectedPage.sections.find((section) => section.id === selectedSectionId) ?? null : null), [selectedPage, selectedSectionId]);

  const persistPage = (page: CmsPageData) => {
    startTransition(async () => {
      try {
        const saved = await saveCmsPageAction({
          slug: page.slug,
          title: page.title,
          status: toDbStatus(page.status),
          content: { sections: page.sections },
        });
        setPages((current) => current.map((item) => (item.id === page.id ? { ...item, id: saved.id } : item)));
        setSelectedPageId((current) => (current === page.id ? saved.id : current));
        toast.success(`Saved “${page.title}”`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save page");
      }
    });
  };

  const saveNow = () => {
    if (!selectedPage) return;
    persistPage(selectedPage);
  };

  const publish = () => {
    if (!selectedPage) return;
    const next: CmsPageData = { ...selectedPage, status: "Published" };
    setPages((current) => current.map((page) => (page.id === next.id ? next : page)));
    persistPage(next);
  };

  const removePage = () => {
    if (!selectedPage) return;
    const target = selectedPage;
    const remaining = pages.filter((page) => page.id !== target.id);
    const nextId = remaining[0]?.id ?? null;

    if (target.id.startsWith("draft-")) {
      setPages(remaining);
      setSelectedPageId(nextId);
      setSelectedSectionId(null);
      return;
    }

    startTransition(async () => {
      try {
        await deleteCmsPageAction(target.id);
        setPages(remaining);
        setSelectedPageId(nextId);
        setSelectedSectionId(null);
        toast.success(`Deleted “${target.title}”`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete page");
      }
    });
  };

  const addSection = (type: SectionType) => {
    if (!selectedPage) return;
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections: [...page.sections, { id: `${type}-${Date.now()}`, ...sectionPresets[type] }] } : page);
    setPages(next);
  };

  const updateSection = (id: string, updates: Partial<CmsSection>) => {
    if (!selectedPage) return;
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections: page.sections.map((section) => section.id === id ? { ...section, ...updates } : section) } : page);
    setPages(next);
  };

  const removeSection = (id: string) => {
    if (!selectedPage) return;
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections: page.sections.filter((section) => section.id !== id) } : page);
    setPages(next);
    setSelectedSectionId(null);
  };

  const duplicateSection = (section: CmsSection) => {
    if (!selectedPage) return;
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections: [...page.sections, { ...section, id: `${section.id}-copy-${Date.now()}` }] } : page);
    setPages(next);
  };

  const moveSection = (index: number, delta: number) => {
    if (!selectedPage) return;
    const sections = [...selectedPage.sections];
    const target = index + delta;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections } : page);
    setPages(next);
  };

  const applyTemplate = (name: string) => {
    if (!selectedPage) return;
    const template = templateSets[name as keyof typeof templateSets];
    if (!template) return;
    const next = pages.map((page) => page.id === selectedPage.id ? { ...page, sections: template.map((section) => ({ ...section, id: `${section.id}-${Date.now()}` })) } : page);
    setPages(next);
    setTemplate(name);
  };

  const addPage = () => {
    const id = `draft-${Date.now()}`;
    const next = [...pages, { id, title: `Untitled Page ${pages.length + 1}`, slug: `/page-${pages.length + 1}`, status: "Draft" as const, sections: [] }];
    setPages(next);
    setSelectedPageId(id);
    setSelectedSectionId(null);
  };

  return (
    <div className="relative min-h-screen space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <motion.section
        className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">MeCart CMS Builder</p>
            <h1 className="mt-3 text-4xl font-black text-white">Page Builder</h1>
            <p className="mt-2 text-sm text-slate-300">Build pages visually with reusable sections while preserving routing and content.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending || !selectedPage} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50" onClick={saveNow}>
              <Save className="mr-2 inline h-4 w-4" /> Save Changes
            </Button>
            <Button disabled={pending || !selectedPage} className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/20 disabled:opacity-50" onClick={publish}>
              Publish Page
            </Button>
            <Button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10" onClick={() => setPreview((value) => !value)}>
              {preview ? "Edit Mode" : "Preview Mode"}
            </Button>
            <Button disabled={pending || !selectedPage} onClick={removePage} className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
              <Trash2 className="mr-2 inline h-4 w-4" /> Delete Page
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[260px_1fr_320px]">
        <Panel title="Pages">
          <div className="space-y-2">
            {pages.map((page) => (
              <Button
                key={page.id}
                onClick={() => { setSelectedPageId(page.id); setSelectedSectionId(null); }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedPage?.id === page.id ? "border-blue-400/40 bg-blue-500/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{page.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${page.status === "Published" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>{page.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{page.slug}</p>
              </Button>
            ))}
            <Button onClick={addPage} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.07]">
              <Plus className="h-4 w-4" /> Add Page
            </Button>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Template Library</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(templateSets).map((templateName) => (
                <Button
                  key={templateName}
                  onClick={() => applyTemplate(templateName)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${template === templateName ? "bg-blue-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
                >
                  <LayoutTemplate className="mr-1 inline h-3.5 w-3.5" />
                  {templateName}
                </Button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={`Canvas — ${selectedPage?.title ?? "No page selected"}`}>
          {!selectedPage ? (
            <EmptyState title="No pages yet" description="Create your first page from the Pages panel to start building." />
          ) : preview ? (
            <div className="space-y-4">
              {selectedPage.sections.map((section) => (
                <div key={section.id} className={section.visible ? "" : "opacity-40"}>
                  <SectionPreview section={section} />
                </div>
              ))}
              {selectedPage.sections.length === 0 && <EmptyState />}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedPage.sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  layout
                  className={`rounded-2xl border p-4 transition ${selectedSectionId === section.id ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button className="text-left" onClick={() => setSelectedSectionId(section.id)}>
                      <p className="font-semibold text-white">{section.title}</p>
                      <p className="text-xs text-slate-400">{section.type} · {section.visible ? "Visible" : "Hidden"}</p>
                    </Button>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => moveSection(index, -1)} className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"><ArrowUp className="h-4 w-4" /></Button>
                      <Button onClick={() => moveSection(index, 1)} className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"><ArrowDown className="h-4 w-4" /></Button>
                      <Button onClick={() => duplicateSection(section)} className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10"><Copy className="h-4 w-4" /></Button>
                      <Button onClick={() => removeSection(section.id)} className="rounded-xl border border-red-400/20 bg-red-500/10 p-2 text-red-200 transition hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <SectionPreview section={section} />
                  </div>
                </motion.div>
              ))}
              {selectedPage.sections.length === 0 && <EmptyState />}
            </div>
          )}
        </Panel>

        <Panel title="Section Library & Editor">
          <div className="mb-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Add Sections</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(sectionPresets) as SectionType[]).map((type) => (
                <Button
                  key={type}
                  onClick={() => addSection(type)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <Plus className="mr-1 inline h-3.5 w-3.5" />
                  {type.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>

          {selectedSection ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Edit Section</p>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Title</span>
                <input value={selectedSection.title} onChange={(event) => updateSection(selectedSection.id, { title: event.target.value })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">Subtitle</span>
                <textarea value={selectedSection.subtitle} onChange={(event) => updateSection(selectedSection.id, { subtitle: event.target.value })} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-blue-400" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Align</span>
                  <select value={selectedSection.align} onChange={(event) => updateSection(selectedSection.id, { align: event.target.value as "left" | "center" })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-400">Theme</span>
                  <select value={selectedSection.theme} onChange={(event) => updateSection(selectedSection.id, { theme: event.target.value as "light" | "dark" | "gradient" })} className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 text-sm text-white">
                    <option value="gradient">Gradient</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                <span>Visible on page</span>
                <Button
                  onClick={() => updateSection(selectedSection.id, { visible: !selectedSection.visible })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${selectedSection.visible ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-slate-400"}`}
                >
                  {selectedSection.visible ? "Visible" : "Hidden"}
                </Button>
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-slate-400">
                <span>Type</span>
                <span className="font-semibold text-white">{selectedSection.type}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
              Select a section on the canvas to edit it, then save your changes with the Save Changes button.
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <Save className="h-4 w-4 text-blue-300" />
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title = "No sections yet", description = "Add hero, product, FAQ, CTA, feature, and newsletter sections from the library." }: { title?: string; description?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-blue-300" />
      <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

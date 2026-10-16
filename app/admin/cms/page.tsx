import { CmsBuilder } from "@/components/admin/cms-builder";
import type { CmsPageData, CmsSection, SectionType } from "@/components/admin/cms-builder";
import { listCmsPages } from "@/lib/repositories/cms";
import type { CmsStatus, Json } from "@/types/database";

export const dynamic = "force-dynamic";

const sectionTypes: readonly SectionType[] = ["hero", "feature-grid", "newsletter", "faq", "product-grid", "cta"];

const statusLabels: Record<CmsStatus, CmsPageData["status"]> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

function isCmsSection(value: unknown): value is CmsSection {
  if (!value || typeof value !== "object") return false;
  const section = value as Record<string, unknown>;
  return (
    typeof section.id === "string" &&
    typeof section.title === "string" &&
    typeof section.subtitle === "string" &&
    typeof section.visible === "boolean" &&
    (section.align === "left" || section.align === "center") &&
    (section.theme === "light" || section.theme === "dark" || section.theme === "gradient") &&
    (typeof section.type === "string" && (sectionTypes as readonly string[]).includes(section.type))
  );
}

function sectionsFromContent(content: Json): CmsSection[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const sections = (content as Record<string, unknown>).sections;
  if (!Array.isArray(sections)) return [];
  return sections.filter(isCmsSection);
}

export default async function AdminCmsPage() {
  const rows = await listCmsPages();

  const pages: CmsPageData[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: statusLabels[row.status],
    sections: sectionsFromContent(row.content),
  }));

  return <CmsBuilder initialPages={pages} />;
}

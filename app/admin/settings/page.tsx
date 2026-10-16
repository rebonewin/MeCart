import { listSettingsRaw } from "@/lib/repositories/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const rows = await listSettingsRaw();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Store Settings</h1>
        <p className="text-sm text-slate-400">
          Store identity, commerce defaults, checkout, security, SEO, and system flags from the settings table.
        </p>
      </div>

      <SettingsForm
        rows={rows.map((row) => ({
          key: row.key,
          value: row.value,
          description: row.description,
          isPublic: row.is_public,
        }))}
      />
    </div>
  );
}

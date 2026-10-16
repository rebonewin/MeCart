import { MediaLibrary } from "@/components/admin/media-library";
import { getMediaStats, listMedia } from "@/lib/repositories/media";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const [items, stats] = await Promise.all([listMedia(), getMediaStats()]);

  const storageLabel =
    stats.storageBytes < 1024 * 1024
      ? `${(stats.storageBytes / 1024).toFixed(1)} KB`
      : `${(stats.storageBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Media Library</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Total files", stats.total],
          ["Images", stats.images],
          ["Documents", stats.documents],
          ["Storage used", storageLabel],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <MediaLibrary items={items} />
    </div>
  );
}

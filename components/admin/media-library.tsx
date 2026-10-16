"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { deleteMediaAction } from "@/lib/actions/media";
import { STORAGE_BUCKETS } from "@/lib/storage-buckets";

type MediaItem = {
  id: string;
  bucket: string;
  path: string;
  url: string;
  name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  folder: string | null;
  created_at: string;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bucket, setBucket] = useState<string>("products");
  const [folder, setFolder] = useState("");
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = filter === "all" ? items : items.filter((i) => i.bucket === filter);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    fd.append("bucket", bucket);
    if (folder) fd.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "Upload failed");
      return;
    }
    toast.success(files.length === 1 ? "File uploaded" : `${files.length} files uploaded`);
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  };

  const remove = (id: string, name: string | null) => {
    startTransition(async () => {
      try {
        await deleteMediaAction(id);
        toast.success(`Deleted ${name ?? "file"}`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500">Bucket</label>
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value)}
            className="mt-1 rounded border px-2 py-1.5 text-sm dark:bg-gray-800"
          >
            {STORAGE_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Folder (optional)</label>
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="e.g. banners"
            className="mt-1 rounded border px-2 py-1.5 text-sm dark:bg-gray-800"
          />
        </div>
        <div className="flex-1" />
        <input
          ref={fileRef}
          type="file"
          multiple
          onChange={onUpload}
          className="hidden"
          id="media-upload-input"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload files"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1 text-xs ${filter === "all" ? "border-indigo-500 text-indigo-600" : "border-gray-300 text-gray-500 dark:border-gray-700"}`}
        >
          All ({items.length})
        </button>
        {STORAGE_BUCKETS.map((b) => {
          const count = items.filter((i) => i.bucket === b).length;
          if (!count) return null;
          return (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`rounded-full border px-3 py-1 text-xs ${filter === b ? "border-indigo-500 text-indigo-600" : "border-gray-300 text-gray-500 dark:border-gray-700"}`}
            >
              {b} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          No media yet. Upload files above.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((item) => {
            const isImage = item.mime_type?.startsWith("image/");
            return (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="relative flex aspect-square items-center justify-center bg-gray-50 dark:bg-gray-800">
                  {isImage ? (
                    <Image
                      src={item.url}
                      alt={item.name ?? item.path}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-xs font-medium" title={item.name ?? item.path}>
                    {item.name ?? item.path.split("/").pop()}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {item.bucket} · {formatBytes(item.size_bytes)}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => remove(item.id, item.name)}
                      disabled={pending}
                      className="rounded p-1 text-gray-400 hover:text-rose-500 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

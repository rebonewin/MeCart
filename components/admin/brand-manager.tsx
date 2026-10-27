"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createBrand, updateBrand, deleteBrand } from "@/lib/actions/catalog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Item = { id: string; name: string; slug: string };

export function BrandManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const submit = () => {
    const payload = { name: editing ? editing.name : name, slug: editing ? editing.slug : slug };
    startTransition(async () => {
      try {
        if (editing) {
          await updateBrand(editing.id, payload);
          setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...payload } : i)));
          toast.success("Brand updated");
          setEditing(null);
        } else {
          await createBrand(payload);
          toast.success("Brand created");
          setName(""); setSlug("");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const remove = (id: string) => {
    setConfirmOpen(true);
    setConfirmAction(() => () => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      startTransition(async () => {
        try {
          await deleteBrand(id);
          toast.success("Brand deleted");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">{editing ? "Edit Brand" : "Add Brand"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={editing ? editing.name : name} onChange={(e) => (editing ? setEditing({ ...editing, name: e.target.value }) : setName(e.target.value))} placeholder="Name" className="rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={editing ? editing.slug : slug} onChange={(e) => (editing ? setEditing({ ...editing, slug: e.target.value }) : setSlug(e.target.value))} placeholder="slug" className="rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={submit} disabled={pending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Save</Button>
          {editing && <Button onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</Button>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{i.name}</td>
                <td className="p-3">{i.slug}</td>
                <td className="p-3 flex gap-2">
                  <Button onClick={() => setEditing(i)} className="text-indigo-600 hover:underline">Edit</Button>
                  <Button onClick={() => remove(i.id)} className="text-rose-600 hover:underline">Delete</Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No brands</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Brand"
        message="Delete this brand?"
        onConfirm={() => { setConfirmOpen(false); confirmAction(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  deleteSubCategory,
} from "@/lib/actions/catalog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Cat = { id: string; name: string; slug: string };
type Sub = { id: string; name: string; slug: string; categoryId: string };

export function CategoryManager({ categories: initialCats, subCategories: initialSubs }: { categories: Cat[]; subCategories: Sub[] }) {
  const router = useRouter();
  const [cats, setCats] = useState(initialCats);
  const [subs, setSubs] = useState(initialSubs);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subCatId, setSubCatId] = useState(initialCats[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const saveCat = () => {
    const payload = { name: editingCat ? editingCat.name : catName, slug: editingCat ? editingCat.slug : catSlug };
    startTransition(async () => {
      try {
        if (editingCat) {
          await updateCategory(editingCat.id, payload);
          setCats((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...payload } : c)));
          setEditingCat(null);
          toast.success("Category updated");
        } else {
          await createCategory(payload);
          toast.success("Category created");
          setCatName(""); setCatSlug("");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const removeCat = (id: string) => {
    setConfirmOpen(true);
    setConfirmAction(() => () => {
      setCats((prev) => prev.filter((c) => c.id !== id));
      setSubs((prev) => prev.filter((s) => s.categoryId !== id));
      startTransition(async () => {
        try {
          await deleteCategory(id);
          toast.success("Category deleted");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      });
    });
  };

  const saveSub = () => {
    startTransition(async () => {
      try {
        await createSubCategory({ name: subName, slug: subSlug, categoryId: subCatId });
        toast.success("Subcategory created");
        setSubName(""); setSubSlug("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const removeSub = (id: string) => {
    setConfirmOpen(true);
    setConfirmAction(() => () => {
      setSubs((prev) => prev.filter((s) => s.id !== id));
      startTransition(async () => {
        try {
          await deleteSubCategory(id);
          toast.success("Subcategory deleted");
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
        <h2 className="text-lg font-semibold">{editingCat ? "Edit Category" : "Add Category"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input value={editingCat ? editingCat.name : catName} onChange={(e) => (editingCat ? setEditingCat({ ...editingCat, name: e.target.value }) : setCatName(e.target.value))} placeholder="Name" className="rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={editingCat ? editingCat.slug : catSlug} onChange={(e) => (editingCat ? setEditingCat({ ...editingCat, slug: e.target.value }) : setCatSlug(e.target.value))} placeholder="slug" className="rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div className="mt-3">
          <button onClick={saveCat} disabled={pending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Save Category</button>
          {editingCat && <button onClick={() => setEditingCat(null)} className="ml-2 rounded-md border px-4 py-2 text-sm">Cancel</button>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.slug}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => setEditingCat(c)} className="text-indigo-600 hover:underline">Edit</button>
                  <button onClick={() => removeCat(c.id)} className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No categories</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Add Subcategory</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <select value={subCatId} onChange={(e) => setSubCatId(e.target.value)} className="rounded border px-3 py-2 dark:bg-gray-800">
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Name" className="rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={subSlug} onChange={(e) => setSubSlug(e.target.value)} placeholder="slug" className="rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <button onClick={saveSub} disabled={pending} className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Add Subcategory</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500"><th className="p-3">Subcategory</th><th className="p-3">Category</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{cats.find((c) => c.id === s.categoryId)?.name ?? s.categoryId}</td>
                <td className="p-3">
                  <button onClick={() => removeSub(s.id)} className="text-rose-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500">No subcategories</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Delete"
        message="Are you sure?"
        onConfirm={() => { setConfirmOpen(false); confirmAction(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

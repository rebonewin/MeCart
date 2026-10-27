"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProduct, bulkDeleteProducts, bulkUpdateProducts, adjustStock } from "@/lib/actions/products";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Link from "next/link";

export type AdminProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  status: string;
  finalPrice: number;
  category: { name: string } | null;
  brand: { name: string } | null;
  images: { url: string }[];
};

export function ProductsManager({
  products,
  total,
  page,
  pageSize,
  q: initialQ,
  status: initialStatus,
}: {
  products: AdminProduct[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  status: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((p) => p.id));
  };

  const askConfirm = (action: () => void) => {
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const run = (fn: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    askConfirm(() => {
      setItems((prev) => prev.filter((p) => p.id !== id));
      run(async () => {
        await deleteProduct(id);
        router.refresh();
      }, "Product deleted");
    });
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    askConfirm(() => {
      const ids = [...selected];
      setItems((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelected([]);
      run(async () => {
        await bulkDeleteProducts(ids);
        router.refresh();
      }, "Products deleted");
    });
  };

  const handleBulkStatus = (newStatus: "ACTIVE" | "DRAFT" | "HIDDEN") => {
    if (selected.length === 0) return;
    const ids = [...selected];
    setItems((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: newStatus } : p)));
    setSelected([]);
    run(async () => {
      await bulkUpdateProducts(ids, { status: newStatus });
      router.refresh();
    }, "Status updated");
  };

  const handleStock = (id: string, delta: number) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)));
    run(async () => {
      await adjustStock(id, delta);
      router.refresh();
    }, "Stock updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Add Product
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/products" method="get">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or SKU..."
          className="rounded border px-3 py-2 text-sm dark:bg-gray-800"
        />
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm dark:bg-gray-800">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        <Button type="submit" className="rounded-md border px-3 py-2 text-sm">Filter</Button>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <Button onClick={handleBulkDelete} disabled={selected.length === 0 || pending} className="rounded border px-3 py-1.5 disabled:opacity-50">
          Bulk Delete
        </Button>
        <Button onClick={() => handleBulkStatus("ACTIVE")} disabled={selected.length === 0 || pending} className="rounded border px-3 py-1.5 disabled:opacity-50">
          Mark Active
        </Button>
        <Button onClick={() => handleBulkStatus("DRAFT")} disabled={selected.length === 0 || pending} className="rounded border px-3 py-1.5 disabled:opacity-50">
          Mark Draft
        </Button>
        <Button onClick={() => handleBulkStatus("HIDDEN")} disabled={selected.length === 0 || pending} className="rounded border px-3 py-1.5 disabled:opacity-50">
          Mark Hidden
        </Button>
        <span className="text-gray-500">{selected.length} selected</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
              <th className="p-3"><input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleAll} /></th>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                <td className="p-3">
                  {p.images[0]?.url ? (
                    <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-100" />
                  )}
                </td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.category?.name ?? "-"}</td>
                <td className="p-3">{p.brand?.name ?? "-"}</td>
                <td className="p-3">${p.finalPrice.toFixed(2)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button onClick={() => handleStock(p.id, -1)} className="rounded border px-1.5">-</Button>
                    <span className="w-8 text-center">{p.stock}</span>
                    <Button onClick={() => handleStock(p.id, 1)} className="rounded border px-1.5">+</Button>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : p.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-700"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${p.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
                    <Button onClick={() => handleDelete(p.id)} className="text-rose-600 hover:underline">Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Link
          href={`/admin/products?page=${Math.max(1, page - 1)}&q=${encodeURIComponent(q)}&status=${status}`}
          className={`rounded border px-3 py-1.5 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
        >
          Prev
        </Link>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <Link
          href={`/admin/products?page=${Math.min(totalPages, page + 1)}&q=${encodeURIComponent(q)}&status=${status}`}
          className={`rounded border px-3 py-1.5 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
        >
          Next
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Action"
        message="Are you sure you want to proceed? This action cannot be undone."
        confirmLabel="Proceed"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmAction();
        }}
      />
    </div>
  );
}

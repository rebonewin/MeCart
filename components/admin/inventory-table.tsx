"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustStock } from "@/lib/actions/products";

export type InventoryTableItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  location: string | null;
  price: number;
  updatedAt: string;
};

function statusBadge(item: InventoryTableItem) {
  if (item.quantity === 0) {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
        Out of stock
      </span>
    );
  }
  if (item.quantity <= item.lowStockThreshold) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
        Low stock
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      In stock
    </span>
  );
}

export function InventoryTable({ items }: { items: InventoryTableItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleAdjust = (item: InventoryTableItem, delta: number) => {
    startTransition(async () => {
      try {
        await adjustStock(item.productId, delta);
        toast.success(
          `${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} unit${Math.abs(delta) === 1 ? "" : "s"} for ${item.productName}`,
        );
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update stock");
      }
    });
  };

  const rowClass = (item: InventoryTableItem) =>
    item.quantity === 0
      ? "bg-rose-50 dark:bg-rose-950/30"
      : item.quantity <= item.lowStockThreshold
        ? "bg-amber-50 dark:bg-amber-950/30"
        : "";

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800">
            <th className="p-3">Product</th>
            <th className="p-3">SKU</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Threshold</th>
            <th className="p-3">Status</th>
            <th className="p-3">Value</th>
            <th className="p-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={`border-b border-gray-100 dark:border-gray-800 ${rowClass(item)}`}>
              <td className="p-3">
                <p className="font-medium">{item.productName}</p>
                {item.location && <p className="text-xs text-gray-500">{item.location}</p>}
              </td>
              <td className="p-3">{item.sku || "-"}</td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => handleAdjust(item, -1)}
                    disabled={pending || item.quantity === 0}
                    className="rounded border px-1.5 py-0.5 disabled:opacity-40"
                  >
                    -
                  </Button>
                  <span className="w-10 text-center font-medium">{item.quantity}</span>
                  <Button
                    onClick={() => handleAdjust(item, 1)}
                    disabled={pending}
                    className="rounded border px-1.5 py-0.5 disabled:opacity-40"
                  >
                    +
                  </Button>
                </div>
                {item.reservedQuantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500">{item.reservedQuantity} reserved</p>
                )}
              </td>
              <td className="p-3">{item.lowStockThreshold}</td>
              <td className="p-3">{statusBadge(item)}</td>
              <td className="p-3">
                {"$" + (item.quantity * item.price).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </td>
              <td className="p-3 text-gray-500">{new Date(item.updatedAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500">
                No inventory records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

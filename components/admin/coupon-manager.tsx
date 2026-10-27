"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCoupon, deleteCoupon } from "@/lib/actions/coupons";

type Coupon = { id: string; code: string; discountPercent: number | null; discountAmount: number | null; active: boolean };

export function CouponManager({ initial }: { initial: Coupon[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      try {
        await createCoupon({
          code,
          discountPercent: percent ? Number(percent) : undefined,
        });
        toast.success("Coupon created");
        setCode(""); setPercent("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      try {
        await deleteCoupon(id);
        setItems((prev) => prev.filter((c) => c.id !== id));
        toast.success("Coupon deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Create Coupon</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" className="rounded border px-3 py-2 dark:bg-gray-800" />
          <input value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="Discount %" type="number" className="rounded border px-3 py-2 dark:bg-gray-800" />
          <Button onClick={submit} disabled={pending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Create</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">{c.discountPercent ? `${c.discountPercent}%` : `$${c.discountAmount}`}</td>
                <td className="p-3">{c.active ? "Yes" : "No"}</td>
                <td className="p-3">
                  <Button onClick={() => remove(c.id)} className="text-rose-600 hover:underline">Delete</Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No coupons</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

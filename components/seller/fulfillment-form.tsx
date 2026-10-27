"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { updateSellerFulfillment } from "@/lib/actions/seller-operations";
import type { VendorFulfillmentStatus } from "@/types/database";

const field =
  "h-10 w-full rounded-xl border border-white/10 bg-[#101116] px-3 text-xs text-white outline-none focus:border-[#D4AF37]/40";

export function SellerFulfillmentForm({
  allocationId,
  status,
  carrier,
  trackingNumber,
  trackingUrl,
}: {
  allocationId: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{ status: VendorFulfillmentStatus; carrier: string; trackingNumber: string; trackingUrl: string }>({
    status: status as VendorFulfillmentStatus,
    carrier: carrier ?? "",
    trackingNumber: trackingNumber ?? "",
    trackingUrl: trackingUrl ?? "",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => {
    startTransition(async () => {
      try {
        await updateSellerFulfillment(allocationId, form);
        toast.success("Fulfilment updated.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update fulfilment");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-slate-500">Status</span>
          <select value={form.status} onChange={set("status")} className={field}>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-slate-500">Carrier</span>
          <input value={form.carrier} onChange={set("carrier")} className={field} placeholder="DHL, UPS, FedEx…" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-slate-500">Tracking number</span>
          <input value={form.trackingNumber} onChange={set("trackingNumber")} className={field} placeholder="1Z…" />
        </label>
        <label>
          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-slate-500">Tracking URL</span>
          <input value={form.trackingUrl} onChange={set("trackingUrl")} className={field} placeholder="https://…" />
        </label>
      </div>
      <Button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768] disabled:opacity-55"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
        {pending ? "Updating…" : "Update fulfilment"}
      </Button>
    </div>
  );
}

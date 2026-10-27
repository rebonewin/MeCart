"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  assignProductOwnership,
  moderateVendorProduct,
  moderateVendorStore,
  processVendorPayout,
  resolveVendorReturn,
  reviewVendor,
  setVendorCommission,
} from "@/lib/actions/admin-marketplace";
import type { VendorPayoutStatus, VendorReturnStatus } from "@/types/database";

const input = "h-9 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50";
const primary = "inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-[11px] font-semibold text-white disabled:opacity-50";
const secondary = "inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-4 text-[11px] font-medium text-slate-300 hover:text-white disabled:opacity-50";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  };
  return { pending, run };
}

export function VendorReviewControls({ vendorId, status }: { vendorId: string; status: string }) {
  const { pending, run } = useAction();
  const [notes, setNotes] = useState("");
  const decide = (decision: "APPROVED" | "UNDER_REVIEW" | "REJECTED" | "SUSPENDED", success: string) =>
    run(() => reviewVendor(vendorId, { decision, notes }), success);

  return (
    <div className="space-y-3">
      <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Review notes (shared with the seller for under-review/rejection decisions)…" className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs leading-5 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <Button type="button" onClick={() => decide("APPROVED", "Vendor approved.")} disabled={pending} className={primary}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve vendor
          </Button>
        )}
        {status === "PENDING" && (
          <Button type="button" onClick={() => decide("UNDER_REVIEW", "Vendor moved under review.")} disabled={pending} className={secondary}>Start review</Button>
        )}
        {status !== "REJECTED" && (
          <Button type="button" onClick={() => decide("REJECTED", "Vendor application rejected.")} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rose-400/25 px-4 text-[11px] font-medium text-rose-300 hover:bg-rose-400/10 disabled:opacity-50">
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        )}
        {status === "APPROVED" && (
          <Button type="button" onClick={() => decide("SUSPENDED", "Vendor suspended.")} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-400/25 px-4 text-[11px] font-medium text-amber-300 hover:bg-amber-400/10 disabled:opacity-50">
            Suspend
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductModerationControls({ productId, approval }: { productId: string; approval: string }) {
  const { pending, run } = useAction();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");

  if (rejecting) {
    return (
      <div className="flex min-w-[240px] flex-col gap-2">
        <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Reason for rejection" className={input} />
        <div className="flex gap-2">
          <Button type="button" onClick={() => run(() => moderateVendorProduct(productId, "REJECTED", notes), "Product rejected.")} disabled={pending || !notes.trim()} className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-400/25 px-3 text-[10px] font-medium text-rose-300 disabled:opacity-40">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />} Reject
          </Button>
          <Button type="button" onClick={() => setRejecting(false)} className="text-[10px] text-slate-500 hover:text-white">Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      {approval !== "APPROVED" && (
        <Button type="button" onClick={() => run(() => moderateVendorProduct(productId, "APPROVED"), "Product approved and published.")} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-500/15 px-3 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/25 disabled:opacity-50">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve
        </Button>
      )}
      {approval !== "REJECTED" && (
        <Button type="button" onClick={() => setRejecting(true)} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-400/20 px-3 text-[10px] font-medium text-rose-300 disabled:opacity-50">
          <X className="h-3 w-3" /> Reject
        </Button>
      )}
    </div>
  );
}

export function StoreModerationControls({ storeId, status }: { storeId: string; status: string }) {
  const { pending, run } = useAction();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value;
        run(() => moderateVendorStore(storeId, next as "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "CLOSED"), `Store marked ${next.toLowerCase().replace("_", " ")}.`);
      }}
      className="h-8 rounded-lg border border-white/10 bg-slate-950/70 px-2 text-[10px] text-slate-300 disabled:opacity-50"
    >
      <option value="DRAFT">Draft</option>
      <option value="PENDING_REVIEW">Pending review</option>
      <option value="ACTIVE">Active</option>
      <option value="SUSPENDED">Suspended</option>
      <option value="CLOSED">Closed</option>
    </select>
  );
}

export function PayoutActions({ payoutId, status }: { payoutId: string; status: string }) {
  const { pending, run } = useAction();
  const [reference, setReference] = useState("");
  const update = (next: VendorPayoutStatus, success: string) => run(() => processVendorPayout(payoutId, next, reference || undefined), success);

  if (["PAID", "REJECTED", "CANCELLED"].includes(status)) {
    return <span className="text-[10px] text-slate-600">Settled</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference" className="h-8 w-28 rounded-lg border border-white/10 bg-slate-950/70 px-2 text-[10px] text-white outline-none" />
      {status === "PENDING" && <Button type="button" onClick={() => update("APPROVED", "Payout approved.")} disabled={pending} className={secondary}>Approve</Button>}
      {status === "APPROVED" && <Button type="button" onClick={() => update("PROCESSING", "Payout processing.")} disabled={pending} className={secondary}>Processing</Button>}
      {["APPROVED", "PROCESSING"].includes(status) && (
        <Button type="button" onClick={() => update("PAID", "Payout marked paid.")} disabled={pending} className={primary}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Mark paid
        </Button>
      )}
      <Button type="button" onClick={() => update("CANCELLED", "Payout cancelled.")} disabled={pending} className="inline-flex h-8 items-center rounded-full border border-rose-400/20 px-3 text-[10px] text-rose-300 disabled:opacity-50">Reject</Button>
    </div>
  );
}

export function ReturnActions({ returnId, status, refundAmount }: { returnId: string; status: string; refundAmount: number }) {
  const { pending, run } = useAction();
  const [refund, setRefund] = useState(String(refundAmount || ""));
  const update = (next: VendorReturnStatus, success: string) => run(() => resolveVendorReturn(returnId, next, next === "REFUNDED" ? Number(refund) : undefined), success);

  if (["REFUNDED", "CLOSED", "CANCELLED", "REJECTED"].includes(status)) return <span className="text-[10px] text-slate-600">Settled</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input type="number" min="0" value={refund} onChange={(event) => setRefund(event.target.value)} placeholder="Refund" className="h-8 w-24 rounded-lg border border-white/10 bg-slate-950/70 px-2 text-[10px] text-white outline-none" />
      {status === "REQUESTED" && (
        <>
          <Button type="button" onClick={() => update("REJECTED", "Return rejected.")} disabled={pending} className="inline-flex h-8 items-center rounded-full border border-rose-400/20 px-3 text-[10px] text-rose-300 disabled:opacity-50">Reject</Button>
          <Button type="button" onClick={() => update("APPROVED", "Return approved.")} disabled={pending} className={secondary}>Approve</Button>
        </>
      )}
      {status === "APPROVED" && <Button type="button" onClick={() => update("RECEIVED", "Return marked received.")} disabled={pending} className={secondary}>Received</Button>}
      {["APPROVED", "RECEIVED"].includes(status) && (
        <Button type="button" onClick={() => update("REFUNDED", "Return refunded.")} disabled={pending} className={primary}>
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Refund
        </Button>
      )}
    </div>
  );
}

export function CommissionForm({ vendorId, rate }: { vendorId: string; rate: number }) {
  const { pending, run } = useAction();
  const [value, setValue] = useState(String(rate));
  return (
    <div className="flex items-center gap-2">
      <input type="number" min="0" max="50" step="0.1" value={value} onChange={(event) => setValue(event.target.value)} className="h-9 w-24 rounded-xl border border-white/10 bg-slate-950/70 px-2 text-xs text-white outline-none" aria-label="Commission rate" />
      <Button type="button" onClick={() => run(() => setVendorCommission(vendorId, Number(value)), "Commission updated.")} disabled={pending || Number(value) === rate} className="inline-flex h-9 items-center gap-1 rounded-full bg-blue-500/15 px-3 text-[10px] font-medium text-blue-200 ring-1 ring-blue-400/25 disabled:opacity-40">
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
      </Button>
    </div>
  );
}

export function OwnershipEditor({
  productId,
  vendorId,
  storeId,
  commissionRate,
  vendorSku,
  vendors,
  stores,
}: {
  productId: string;
  vendorId: string | null;
  storeId: string | null;
  commissionRate: number | null;
  vendorSku: string | null;
  vendors: { id: string; display_name: string; commission_rate: number }[];
  stores: { id: string; name: string; vendor_id: string }[];
}) {
  const { pending, run } = useAction();
  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(vendorId ?? "");
  const [selectedStore, setSelectedStore] = useState(storeId ?? "");
  const [rate, setRate] = useState(commissionRate !== null ? String(commissionRate) : "");
  const [sku, setSku] = useState(vendorSku ?? "");
  const availableStores = stores.filter((store) => store.vendor_id === selectedVendor);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="inline-flex h-8 items-center rounded-full border border-white/10 px-3 text-[10px] font-medium text-slate-300 hover:border-blue-400/30 hover:text-white">
        Manage ownership
      </Button>
    );
  }

  return (
    <div className="w-full min-w-[260px] space-y-2 rounded-xl border border-blue-400/20 bg-blue-500/[0.06] p-3">
      <select
        value={selectedVendor}
        onChange={(event) => {
          setSelectedVendor(event.target.value);
          setSelectedStore("");
          const vendor = vendors.find((item) => item.id === event.target.value);
          if (vendor) setRate(String(vendor.commission_rate));
        }}
        className={input}
      >
        <option value="">Platform owned</option>
        {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.display_name}</option>)}
      </select>
      <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)} disabled={!selectedVendor} className={input}>
        <option value="">No specific store</option>
        {availableStores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min="0" max="50" step="0.1" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Commission %" className={input} disabled={!selectedVendor} />
        <input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Vendor SKU" className={input} disabled={!selectedVendor} />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => run(() => assignProductOwnership(productId, {
            vendorId: selectedVendor || null,
            storeId: selectedStore || null,
            commissionRate: selectedVendor && rate ? Number(rate) : null,
            vendorSku: sku || null,
          }), "Product ownership updated.")}
          disabled={pending}
          className={primary}
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
        </Button>
        <Button type="button" onClick={() => setOpen(false)} className="text-[10px] text-slate-500 hover:text-white">Cancel</Button>
      </div>
    </div>
  );
}

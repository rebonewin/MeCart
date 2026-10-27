"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { processSellerReturn } from "@/lib/actions/seller-operations";
import type { VendorReturnStatus } from "@/types/database";

export function SellerReturnActions({
  returnId,
  status,
  refundAmount,
}: {
  returnId: string;
  status: VendorReturnStatus;
  refundAmount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [refund, setRefund] = useState(String(refundAmount || ""));

  const run = (next: VendorReturnStatus) => startTransition(async () => {
    try {
      await processSellerReturn(returnId, next, next === "REFUNDED" ? Number(refund) : undefined);
      toast.success(`Return marked ${next.toLowerCase()}.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update return");
    }
  });

  if (["REFUNDED", "CLOSED", "CANCELLED", "REJECTED"].includes(status)) {
    return <span className="text-[10px] text-slate-600">No action required</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input type="number" min="0" step="0.01" value={refund} onChange={(event) => setRefund(event.target.value)} placeholder="Refund" className="h-8 w-24 rounded-lg border border-white/10 bg-[#101116] px-2 text-xs text-white outline-none focus:border-[#D4AF37]/40" />
      {status === "REQUESTED" && (
        <>
          <Button type="button" onClick={() => run("REJECTED")} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full border border-rose-400/20 px-3 text-[10px] text-rose-300 disabled:opacity-50"><X className="h-3 w-3" /> Reject</Button>
          <Button type="button" onClick={() => run("APPROVED")} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#D4AF37] px-3 text-[10px] font-semibold text-[#0B0B0F] disabled:opacity-50">{pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Approve</Button>
        </>
      )}
      {status === "APPROVED" && (
        <Button type="button" onClick={() => run("RECEIVED")} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#D4AF37] px-3 text-[10px] font-semibold text-[#0B0B0F] disabled:opacity-50">{pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Mark received</Button>
      )}
      {status === "RECEIVED" && (
        <Button type="button" onClick={() => run("REFUNDED")} disabled={pending} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#D4AF37] px-3 text-[10px] font-semibold text-[#0B0B0F] disabled:opacity-50">{pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Refund</Button>
      )}
    </div>
  );
}

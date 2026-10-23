"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSellerProduct, submitSellerProduct } from "@/lib/actions/seller-products";
import { cn } from "@/lib/cn";

export function SellerProductRowActions({
  productId,
  approvalStatus,
}: {
  productId: string;
  approvalStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    startTransition(async () => {
      try {
        await submitSellerProduct(productId);
        toast.success("Product submitted for marketplace review.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not submit product");
      }
    });
  };

  const remove = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      try {
        await deleteSellerProduct(productId);
        toast.success("Product archived.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not archive product");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {approvalStatus !== "APPROVED" && (
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#d8b45a]/30 bg-[#d8b45a]/10 px-3 text-[11px] font-semibold text-[#f5dfa2] transition hover:bg-[#d8b45a]/20 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          Submit
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition disabled:opacity-50",
          confirming
            ? "border-rose-400/40 bg-rose-400/15 text-rose-200"
            : "border-white/10 text-slate-400 hover:border-rose-400/30 hover:text-rose-300",
        )}
      >
        <Trash2 className="h-3 w-3" />
        {confirming ? "Confirm" : "Archive"}
      </button>
    </div>
  );
}

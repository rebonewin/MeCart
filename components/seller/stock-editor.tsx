"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adjustSellerStock } from "@/lib/actions/seller-products";

export function SellerStockEditor({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [pending, startTransition] = useTransition();

  const save = () => {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error("Stock must be a whole number.");
      return;
    }
    startTransition(async () => {
      try {
        await adjustSellerStock(productId, quantity);
        toast.success("Stock updated.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update stock");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-20 rounded-lg border border-white/10 bg-[#07090f] px-2 text-xs tabular-nums text-white outline-none focus:border-[#d8b45a]/40"
        aria-label="Stock quantity"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending || Number(value) === stock}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8b45a]/25 bg-[#d8b45a]/10 text-[#f5dfa2] transition hover:bg-[#d8b45a]/20 disabled:opacity-35"
        aria-label="Save stock"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

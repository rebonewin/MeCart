"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Power } from "lucide-react";
import { toast } from "sonner";
import { createSellerCoupon, toggleSellerCoupon } from "@/lib/actions/seller-operations";
import { cn } from "@/lib/cn";

const field = "h-10 w-full rounded-xl border border-white/10 bg-[#07090f] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40";

export function SellerCouponForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ code: "", description: "", discountPercent: "10", discountAmount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => {
    if (form.code.trim().length < 3) {
      toast.error("Coupon code must be at least 3 characters.");
      return;
    }
    if (!form.discountPercent && !form.discountAmount) {
      toast.error("Set a percentage or fixed discount.");
      return;
    }
    startTransition(async () => {
      try {
        await createSellerCoupon({
          code: form.code,
          description: form.description,
          discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
          discountAmount: form.discountAmount ? Number(form.discountAmount) : undefined,
          minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          expiresAt: form.expiresAt,
        });
        toast.success("Coupon created.");
        setForm({ code: "", description: "", discountPercent: "10", discountAmount: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create coupon");
      }
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#d8b45a] px-5 text-xs font-semibold text-[#1e1708] transition hover:bg-[#e7c778]">
        <Plus className="h-3.5 w-3.5" /> New coupon
      </button>
    );
  }

  return (
    <div className="w-full rounded-3xl border border-[#d8b45a]/20 bg-[#d8b45a]/[0.05] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Create a coupon</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input value={form.code} onChange={set("code")} placeholder="CODE" className={field} />
        <input value={form.description} onChange={set("description")} placeholder="Description" className={`${field} lg:col-span-2`} />
        <input type="number" min="0" max="100" value={form.discountPercent} onChange={set("discountPercent")} placeholder="Percent off" className={field} />
        <input type="number" min="0" value={form.discountAmount} onChange={set("discountAmount")} placeholder="Fixed amount off" className={field} />
        <input type="number" min="0" value={form.minOrderValue} onChange={set("minOrderValue")} placeholder="Minimum order" className={field} />
        <input type="number" min="1" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Usage limit" className={field} />
        <input type="date" value={form.expiresAt} onChange={set("expiresAt")} className={field} />
        <button type="button" onClick={submit} disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#d8b45a] px-4 text-xs font-semibold text-[#1e1708] disabled:opacity-55">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create
        </button>
      </div>
    </div>
  );
}

export function SellerCouponToggle({ couponId, active }: { couponId: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const toggle = () => startTransition(async () => {
    try {
      await toggleSellerCoupon(couponId);
      toast.success(active ? "Coupon paused." : "Coupon activated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update coupon");
    }
  });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition",
        active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-slate-400 hover:text-white",
      )}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
      {active ? "Active" : "Paused"}
    </button>
  );
}

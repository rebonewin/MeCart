"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { requestSellerPayout, savePayoutAccount } from "@/lib/actions/seller-operations";

const field = "h-10 w-full rounded-xl border border-white/10 bg-[#07090f] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40";

export function SellerPayoutRequest({ available }: { available: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const request = () => startTransition(async () => {
    try {
      const payout = await requestSellerPayout();
      toast.success(`Payout ${payout.payout_number} requested.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request payout");
    }
  });

  return (
    <button type="button" onClick={request} disabled={pending || available <= 0} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#d8b45a] px-5 text-xs font-semibold text-[#1e1708] transition hover:bg-[#e7c778] disabled:opacity-40">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
      Request payout
    </button>
  );
}

export function SellerPayoutAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ provider: "STRIPE" as "STRIPE" | "PAYPAL" | "BANK", accountName: "", accountEmail: "", accountLast4: "", bankName: "", makeDefault: true });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => {
    if (!form.accountName.trim()) {
      toast.error("Account name is required.");
      return;
    }
    startTransition(async () => {
      try {
        await savePayoutAccount(form);
        toast.success("Payout method saved for verification.");
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save payout method");
      }
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium text-slate-300 transition hover:border-[#d8b45a]/40 hover:text-white">
        <Plus className="h-3.5 w-3.5" /> Add payout method
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#d8b45a]/20 bg-[#d8b45a]/[0.05] p-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#d8b45a]" />
        <h4 className="text-xs font-semibold text-white">Payout method</h4>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={form.provider} onChange={set("provider")} className={field}>
          <option value="STRIPE">Stripe</option>
          <option value="PAYPAL">PayPal</option>
          <option value="BANK">Bank transfer</option>
        </select>
        <input value={form.accountName} onChange={set("accountName")} placeholder="Account holder" className={field} />
        <input value={form.accountEmail} onChange={set("accountEmail")} placeholder="Account email" className={field} />
        <input value={form.accountLast4} onChange={set("accountLast4")} placeholder="Last 4 digits / IBAN tail" className={field} />
        {form.provider === "BANK" && <input value={form.bankName} onChange={set("bankName")} placeholder="Bank name" className={field} />}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={submit} disabled={pending} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#d8b45a] px-4 text-[11px] font-semibold text-[#1e1708] disabled:opacity-55">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Save method
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-4 text-[11px] text-slate-400 hover:text-white">Cancel</button>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-600">Only the last four digits are stored. Full banking details are never persisted in MeCart.</p>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { addSellerShippingRate, createSellerShippingProfile } from "@/lib/actions/seller-operations";

const field = "h-10 w-full rounded-xl border border-white/10 bg-[#101116] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40";

export function SellerShippingControls({ profiles }: { profiles: { id: string; name: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"rate" | "profile" | null>(null);
  const [pending, startTransition] = useTransition();
  const [rate, setRate] = useState({ profileId: profiles[0]?.id ?? "", name: "Standard tracked", countries: "US, CA, GB", price: "12", freeOver: "150", minDays: "3", maxDays: "7" });
  const [profile, setProfile] = useState({ name: "Made to order", processingMinDays: "2", processingMaxDays: "5", makeDefault: false });

  const setRateField = (key: keyof typeof rate) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setRate((current) => ({ ...current, [key]: event.target.value }));
  const setProfileField = (key: keyof typeof profile) => (event: React.ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [key]: event.target.value }));

  const submitRate = () => startTransition(async () => {
    try {
      await addSellerShippingRate({
        profileId: rate.profileId,
        name: rate.name,
        countries: rate.countries.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean),
        rate: Number(rate.price),
        freeOver: rate.freeOver ? Number(rate.freeOver) : undefined,
        minDays: Number(rate.minDays),
        maxDays: Number(rate.maxDays),
      });
      toast.success("Shipping rate added.");
      setMode(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add rate");
    }
  });

  const submitProfile = () => startTransition(async () => {
    try {
      await createSellerShippingProfile({
        name: profile.name,
        processingMinDays: Number(profile.processingMinDays),
        processingMaxDays: Number(profile.processingMaxDays),
        makeDefault: profile.makeDefault,
      });
      toast.success("Shipping profile created.");
      setMode(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create profile");
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setMode(mode === "rate" ? null : "rate")} disabled={!profiles.length} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768] disabled:opacity-40">
          <Plus className="h-3.5 w-3.5" /> Add rate
        </Button>
        <Button type="button" onClick={() => setMode(mode === "profile" ? null : "profile")} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium text-slate-300 hover:border-[#D4AF37]/40 hover:text-white">
          <Truck className="h-3.5 w-3.5" /> New profile
        </Button>
      </div>

      {mode === "rate" && (
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <select value={rate.profileId} onChange={setRateField("profileId")} className={field}>
              {profiles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input value={rate.name} onChange={setRateField("name")} placeholder="Rate name" className={field} />
            <input value={rate.countries} onChange={setRateField("countries")} placeholder="Countries (comma separated ISO)" className={field} />
            <input type="number" min="0" value={rate.price} onChange={setRateField("price")} placeholder="Rate" className={field} />
            <input type="number" min="0" value={rate.freeOver} onChange={setRateField("freeOver")} placeholder="Free over" className={field} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min="0" value={rate.minDays} onChange={setRateField("minDays")} placeholder="Min days" className={field} />
              <input type="number" min="0" value={rate.maxDays} onChange={setRateField("maxDays")} placeholder="Max days" className={field} />
            </div>
          </div>
          <Button type="button" onClick={submitRate} disabled={pending} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#D4AF37] px-4 text-[11px] font-semibold text-[#0B0B0F] disabled:opacity-55">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Save rate
          </Button>
        </div>
      )}

      {mode === "profile" && (
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={profile.name} onChange={setProfileField("name")} placeholder="Profile name" className={field} />
            <input type="number" min="0" value={profile.processingMinDays} onChange={setProfileField("processingMinDays")} placeholder="Min processing days" className={field} />
            <input type="number" min="0" value={profile.processingMaxDays} onChange={setProfileField("processingMaxDays")} placeholder="Max processing days" className={field} />
          </div>
          <Button type="button" onClick={submitProfile} disabled={pending || !profile.name.trim()} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#D4AF37] px-4 text-[11px] font-semibold text-[#0B0B0F] disabled:opacity-55">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Create profile
          </Button>
        </div>
      )}
    </div>
  );
}

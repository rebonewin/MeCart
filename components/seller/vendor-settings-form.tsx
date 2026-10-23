"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateVendorProfile } from "@/lib/actions/vendor";
import type { VendorRow } from "@/types/database";

const field = "h-10 w-full rounded-xl border border-white/10 bg-[#07090f] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40";
const label = "mb-1 block text-[10px] uppercase tracking-[0.14em] text-slate-500";

export function VendorSettingsForm({ vendor }: { vendor: VendorRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    displayName: vendor.display_name,
    legalName: vendor.legal_name,
    email: vendor.email,
    phone: vendor.phone ?? "",
    description: vendor.description ?? "",
    country: vendor.country,
    supportEmail: vendor.support_email ?? "",
    supportPhone: vendor.support_phone ?? "",
    returnPolicy: vendor.return_policy ?? "",
    shippingPolicy: vendor.shipping_policy ?? "",
    logoUrl: vendor.logo_url ?? "",
    bannerUrl: vendor.banner_url ?? "",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => startTransition(async () => {
    try {
      await updateVendorProfile(form);
      toast.success("Vendor profile updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    }
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={label} htmlFor="vendor-display">Display name</label>
        <input id="vendor-display" value={form.displayName} onChange={set("displayName")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-legal">Legal name</label>
        <input id="vendor-legal" value={form.legalName} onChange={set("legalName")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-email">Business email</label>
        <input id="vendor-email" type="email" value={form.email} onChange={set("email")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-phone">Phone</label>
        <input id="vendor-phone" value={form.phone} onChange={set("phone")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-support-email">Support email</label>
        <input id="vendor-support-email" type="email" value={form.supportEmail} onChange={set("supportEmail")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-support-phone">Support phone</label>
        <input id="vendor-support-phone" value={form.supportPhone} onChange={set("supportPhone")} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-country">Country</label>
        <select id="vendor-country" value={form.country} onChange={set("country")} className={field}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="FR">France</option>
          <option value="IT">Italy</option>
          <option value="AE">United Arab Emirates</option>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="vendor-logo">Logo URL</label>
        <input id="vendor-logo" value={form.logoUrl} onChange={set("logoUrl")} className={field} placeholder="https://…" />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="vendor-description">Brand story</label>
        <textarea id="vendor-description" value={form.description} onChange={set("description")} rows={5} className={`${field} h-auto py-2.5`} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="vendor-banner">Banner URL</label>
        <input id="vendor-banner" value={form.bannerUrl} onChange={set("bannerUrl")} className={field} placeholder="https://…" />
      </div>
      <div>
        <label className={label} htmlFor="vendor-return">Default return policy</label>
        <textarea id="vendor-return" value={form.returnPolicy} onChange={set("returnPolicy")} rows={4} className={`${field} h-auto py-2.5`} />
      </div>
      <div>
        <label className={label} htmlFor="vendor-shipping-policy">Default shipping policy</label>
        <textarea id="vendor-shipping-policy" value={form.shippingPolicy} onChange={set("shippingPolicy")} rows={4} className={`${field} h-auto py-2.5`} />
      </div>
      <div className="sm:col-span-2">
        <button type="button" onClick={submit} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#d8b45a] px-5 text-xs font-semibold text-[#1e1708] disabled:opacity-55">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save vendor profile
        </button>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { createStore, updateStoreProfile } from "@/lib/actions/vendor";
import type { StoreRow } from "@/types/database";

const field = "h-10 w-full rounded-xl border border-white/10 bg-[#101116] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40";
const label = "mb-1 block text-[10px] uppercase tracking-[0.14em] text-slate-500";

export function SellerStoreForm({ store, compact = false }: { store?: StoreRow; compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(Boolean(store));
  const [form, setForm] = useState({
    name: store?.name ?? "",
    tagline: store?.tagline ?? "",
    description: store?.description ?? "",
    email: store?.email ?? "",
    phone: store?.phone ?? "",
    city: store?.city ?? "",
    state: store?.state ?? "",
    country: store?.country ?? "US",
    zip: store?.zip ?? "",
    logoUrl: store?.logo_url ?? "",
    bannerUrl: store?.banner_url ?? "",
    brandPrimaryColor: store?.brand_primary_color ?? "#4f46e5",
    brandAccentColor: store?.brand_accent_color ?? "#D4AF37",
    returnPolicy: store?.return_policy ?? "",
    shippingPolicy: store?.shipping_policy ?? "",
    seoTitle: store?.seo_title ?? "",
    seoDescription: store?.seo_description ?? "",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => {
    if (form.name.trim().length < 2) {
      toast.error("Store name is required.");
      return;
    }
    startTransition(async () => {
      try {
        if (store) {
          await updateStoreProfile(store.id, form);
          toast.success("Store updated.");
          router.refresh();
        } else {
          await createStore(form);
          toast.success("Store created. It will go live after review.");
          setOpen(false);
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save store");
      }
    });
  };

  if (!store && !open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768]">
        <Plus className="h-3.5 w-3.5" /> New store
      </Button>
    );
  }

  return (
    <div className={compact ? "" : "rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6"}>
      {!store && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Create a store</h3>
          <Button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-white">Cancel</Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="store-name">Store name</label>
          <input id="store-name" value={form.name} onChange={set("name")} className={field} placeholder="Aurelle Objects" />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="store-tagline">Tagline</label>
          <input id="store-tagline" value={form.tagline} onChange={set("tagline")} className={field} placeholder="Quiet objects, made to outlast trends." />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="store-description">Store story</label>
          <textarea id="store-description" value={form.description} onChange={set("description")} rows={4} className={`${field} h-auto py-2.5`} placeholder="The point of view behind your store." />
        </div>
        <div>
          <label className={label} htmlFor="store-email">Support email</label>
          <input id="store-email" type="email" value={form.email} onChange={set("email")} className={field} placeholder="care@aurelle.com" />
        </div>
        <div>
          <label className={label} htmlFor="store-phone">Phone</label>
          <input id="store-phone" value={form.phone} onChange={set("phone")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="store-city">City</label>
          <input id="store-city" value={form.city} onChange={set("city")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="store-state">State / region</label>
          <input id="store-state" value={form.state} onChange={set("state")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="store-country">Country</label>
          <select id="store-country" value={form.country} onChange={set("country")} className={field}>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="AE">United Arab Emirates</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="store-zip">Postal code</label>
          <input id="store-zip" value={form.zip} onChange={set("zip")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="store-logo">Logo URL</label>
          <input id="store-logo" value={form.logoUrl} onChange={set("logoUrl")} className={field} placeholder="https://…" />
        </div>
        <div>
          <label className={label} htmlFor="store-banner">Banner URL</label>
          <input id="store-banner" value={form.bannerUrl} onChange={set("bannerUrl")} className={field} placeholder="https://…" />
        </div>
        <div>
          <label className={label} htmlFor="store-primary">Brand colour</label>
          <div className="flex gap-2">
            <input id="store-primary" type="color" value={form.brandPrimaryColor} onChange={set("brandPrimaryColor")} className="h-10 w-12 rounded-xl border border-white/10 bg-transparent p-1" />
            <input value={form.brandPrimaryColor} onChange={set("brandPrimaryColor")} className={field} />
          </div>
        </div>
        <div>
          <label className={label} htmlFor="store-accent">Accent colour</label>
          <div className="flex gap-2">
            <input id="store-accent" type="color" value={form.brandAccentColor} onChange={set("brandAccentColor")} className="h-10 w-12 rounded-xl border border-white/10 bg-transparent p-1" />
            <input value={form.brandAccentColor} onChange={set("brandAccentColor")} className={field} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="store-return">Return policy</label>
          <textarea id="store-return" value={form.returnPolicy} onChange={set("returnPolicy")} rows={3} className={`${field} h-auto py-2.5`} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="store-shipping-policy">Shipping policy</label>
          <textarea id="store-shipping-policy" value={form.shippingPolicy} onChange={set("shippingPolicy")} rows={3} className={`${field} h-auto py-2.5`} />
        </div>
        <div>
          <label className={label} htmlFor="store-seo-title">SEO title</label>
          <input id="store-seo-title" value={form.seoTitle} onChange={set("seoTitle")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="store-seo-description">SEO description</label>
          <input id="store-seo-description" value={form.seoDescription} onChange={set("seoDescription")} className={field} />
        </div>
      </div>
      <Button type="button" onClick={submit} disabled={pending} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#D4AF37] px-5 text-xs font-semibold text-[#0B0B0F] disabled:opacity-55">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {store ? "Save store" : "Create store"}
      </Button>
    </div>
  );
}

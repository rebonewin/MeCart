"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, ShieldCheck, Store, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createVendorApplication } from "@/lib/actions/vendor";

const inputClass =
  "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#D4AF37]/50 focus:ring-4 focus:ring-[#D4AF37]/10";
const labelClass = "mb-1.5 block text-xs font-medium text-slate-300";

export function VendorOnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    displayName: "",
    legalName: "",
    email: defaultEmail,
    phone: "",
    description: "",
    country: "US",
    businessType: "",
    taxId: "",
    contactName: "",
    storeName: "",
    storeTagline: "",
    storeDescription: "",
    returnPolicy: "Returns accepted within 14 days of delivery in original condition.",
    shippingPolicy: "Orders are packed within 2 business days. Tracking is shared on dispatch.",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = () => {
    if (!form.displayName.trim() || !form.storeName.trim() || !form.email.trim()) {
      toast.error("Business name, store name and email are required.");
      return;
    }
    startTransition(async () => {
      try {
        await createVendorApplication(form);
        toast.success("Application submitted. Welcome to the atelier.");
        router.push("/seller");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not submit application");
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
      <aside className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1D24] p-7 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(216,180,90,0.22),transparent_68%)] blur-2xl"
        />
        <span className="relative inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E6C768]">
          <Sparkles className="h-3.5 w-3.5" /> MeCart Marketplace
        </span>
        <h2 className="relative mt-7 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          Bring your atelier to a wider audience.
        </h2>
        <p className="relative mt-4 max-w-md text-sm leading-7 text-slate-400">
          Apply once, then manage every store, product, order and payout from one seller workspace.
          MeCart handles discovery, checkout and trust.
        </p>
        <div className="relative mt-8 space-y-4">
          {[
            ["Storefronts built in", "Launch a branded store page with your own story, policies and identity."],
            ["One operational cockpit", "Orders, inventory, returns, messages and reviews in a single queue."],
            ["Transparent finance", "Commission snapshots, an append-only ledger and scheduled payouts."],
            ["Human review", "Our marketplace team reviews sellers and catalogue items before launch."],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]">
                <Check className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-9 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" />
          Your legal documents are stored privately and only visible to reviewers.
        </div>
      </aside>

      <div className="rounded-[2rem] border border-white/10 bg-[#1A1D24] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#D4AF37]">Seller application</p>
            <h1 className="mt-2 text-xl font-semibold text-white">
              {step === 1 ? "Tell us about your business" : step === 2 ? "Name your first store" : "Review and submit"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((value) => (
              <span
                key={value}
                className={`h-1.5 w-8 rounded-full ${value <= step ? "bg-[#D4AF37]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="displayName">Business name</label>
                <input id="displayName" className={inputClass} value={form.displayName} onChange={set("displayName")} placeholder="Maison Aurelle" />
              </div>
              <div>
                <label className={labelClass} htmlFor="legalName">Legal entity name</label>
                <input id="legalName" className={inputClass} value={form.legalName} onChange={set("legalName")} placeholder="Aurelle Studio LLC" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="email">Business email</label>
                <input id="email" type="email" className={inputClass} value={form.email} onChange={set("email")} placeholder="studio@aurelle.com" />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Phone</label>
                <input id="phone" className={inputClass} value={form.phone} onChange={set("phone")} placeholder="+1 555 010 2200" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="businessType">Business type</label>
                <select id="businessType" className={inputClass} value={form.businessType} onChange={set("businessType")}>
                  <option value="">Select one</option>
                  <option value="INDIVIDUAL">Independent maker</option>
                  <option value="LLC">LLC</option>
                  <option value="CORPORATION">Corporation</option>
                  <option value="PARTNERSHIP">Partnership</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="country">Country</label>
                <select id="country" className={inputClass} value={form.country} onChange={set("country")}>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="AE">United Arab Emirates</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="description">What do you make or curate?</label>
              <textarea id="description" className={`${inputClass} h-28 py-3`} value={form.description} onChange={set("description")} placeholder="A short introduction to your craft, sourcing and point of view." />
            </div>
            <div>
              <label className={labelClass} htmlFor="taxId">Tax / business registration number (optional)</label>
              <input id="taxId" className={inputClass} value={form.taxId} onChange={set("taxId")} placeholder="Only visible to marketplace reviewers" />
            </div>
            <Button type="button" onClick={() => setStep(2)} className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768]">
              Continue to store setup <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <div>
              <label className={labelClass} htmlFor="storeName">Store name</label>
              <div className="relative">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input id="storeName" className={`${inputClass} pl-11`} value={form.storeName} onChange={set("storeName")} placeholder="Aurelle Objects" />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">You can rename this and add more stores later.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="storeTagline">Tagline</label>
              <input id="storeTagline" className={inputClass} value={form.storeTagline} onChange={set("storeTagline")} placeholder="Quiet objects, made to outlast trends." />
            </div>
            <div>
              <label className={labelClass} htmlFor="storeDescription">Store story</label>
              <textarea id="storeDescription" className={`${inputClass} h-32 py-3`} value={form.storeDescription} onChange={set("storeDescription")} placeholder="What a customer should feel when they arrive at your store." />
            </div>
            <div>
              <label className={labelClass} htmlFor="returnPolicy">Return policy</label>
              <textarea id="returnPolicy" className={`${inputClass} h-24 py-3`} value={form.returnPolicy} onChange={set("returnPolicy")} />
            </div>
            <div>
              <label className={labelClass} htmlFor="shippingPolicy">Shipping policy</label>
              <textarea id="shippingPolicy" className={`${inputClass} h-24 py-3`} value={form.shippingPolicy} onChange={set("shippingPolicy")} />
            </div>
            <div className="flex gap-3">
              <Button type="button" onClick={() => setStep(1)} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/10 text-sm text-slate-300 transition hover:text-white">
                Back
              </Button>
              <Button type="button" onClick={() => setStep(3)} className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768]">
                Review application <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              {[
                ["Business", form.displayName || "Not set"],
                ["Legal entity", form.legalName || form.displayName || "Not set"],
                ["Email", form.email],
                ["Store", form.storeName || "Not set"],
                ["Country", form.country],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-medium text-slate-200">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              By submitting, you confirm the information is accurate and agree to MeCart marketplace
              standards, commission terms and seller policies. Our team typically reviews applications
              within two business days.
            </p>
            <div className="mt-5 flex gap-3">
              <Button type="button" onClick={() => setStep(2)} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/10 text-sm text-slate-300 transition hover:text-white">
                Back
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={pending}
                className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768] disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {pending ? "Submitting…" : "Submit application"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

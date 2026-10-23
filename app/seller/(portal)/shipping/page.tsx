import { Truck } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerShipping } from "@/lib/repositories/seller";
import { money } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader } from "@/components/seller/ui";
import { SellerShippingControls } from "@/components/seller/shipping-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shipping | MeCart Seller" };

export default async function SellerShippingPage() {
  const context = await requireSellerContext();
  const { profiles, rates } = await listSellerShipping(context.vendor.id);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Operations"
        title="Shipping"
        description="Processing profiles and country-level rates applied to your products at checkout."
        actions={<SellerShippingControls profiles={profiles.map((profile) => ({ id: profile.id, name: profile.name }))} />}
      />

      {profiles.length === 0 ? (
        <SellerEmpty title="No shipping profiles" description="Create a processing profile, then add rates for the destinations you serve." />
      ) : (
        <div className="space-y-5">
          {profiles.map((profile) => {
            const profileRates = rates.filter((rate) => rate.profile_id === profile.id);
            return (
              <SellerCard key={profile.id} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#d8b45a]/20 bg-[#d8b45a]/10 text-[#d8b45a]">
                      <Truck className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{profile.name}</h3>
                        {profile.is_default && <SellerBadge tone="gold">Default</SellerBadge>}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Processing {profile.processing_min_days}–{profile.processing_max_days} business days
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600">{profileRates.length} rates</span>
                </div>
                {profileRates.length ? (
                  <div className="divide-y divide-white/[0.05]">
                    {profileRates.map((rate) => (
                      <div key={rate.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-slate-200">{rate.name}</p>
                          <p className="mt-0.5 text-[10px] text-slate-600">{rate.countries.join(", ") || "All countries"} · {rate.min_days}–{rate.max_days} days</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {rate.free_over ? <span className="text-[10px] text-slate-500">Free over {money(rate.free_over)}</span> : null}
                          <span className="text-xs tabular-nums text-[#f5dfa2]">{money(rate.rate)}</span>
                          <SellerBadge tone={rate.is_active ? "success" : "neutral"}>{rate.is_active ? "Active" : "Off"}</SellerBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-center text-xs text-slate-500">No rates yet for this profile.</p>
                )}
              </SellerCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

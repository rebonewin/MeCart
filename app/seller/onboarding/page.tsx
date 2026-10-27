import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSellerContext } from "@/lib/marketplace/context";
import { VendorOnboardingForm } from "@/components/seller/vendor-onboarding-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Become a Seller | MeCart Marketplace",
  description: "Apply to sell on MeCart and launch your own storefront.",
};

export default async function SellerOnboardingPage() {
  const [user, context] = await Promise.all([getCurrentUser(), getSellerContext()]);
  if (!user) redirect("/login?callbackUrl=/seller/onboarding");
  if (context) redirect("/seller");

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(216,180,90,0.12),transparent_62%)]"
      />
      <header className="relative border-b border-white/[0.06] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-wide">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37] text-[13px] font-black text-[#0B0B0F]">
              M
            </span>
            MeCart
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 transition hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to marketplace
          </Link>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
          Sell on MeCart
        </div>
        <VendorOnboardingForm defaultEmail={user.email ?? ""} />
      </main>
    </div>
  );
}

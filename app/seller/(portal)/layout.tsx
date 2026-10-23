import { redirect } from "next/navigation";
import { getSellerContext } from "@/lib/marketplace/context";
import { SellerShell } from "@/components/seller/seller-shell";

export const dynamic = "force-dynamic";

export default async function SellerPortalLayout({ children }: { children: React.ReactNode }) {
  const context = await getSellerContext();
  if (!context) redirect("/seller/onboarding");

  return (
    <SellerShell
      vendorName={context.vendor.display_name}
      vendorSlug={context.vendor.slug}
      status={context.vendor.status}
      username={context.user.username || context.user.name}
    >
      {context.vendor.status === "PENDING" || context.vendor.status === "UNDER_REVIEW" ? (
        <div className="mb-6 flex flex-col gap-2 rounded-3xl border border-amber-400/20 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Your seller application is under review. You can prepare products and your store now;
            they go live after MeCart approval.
          </p>
          <span className="shrink-0 rounded-full border border-amber-300/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
            {context.vendor.status.replaceAll("_", " ")}
          </span>
        </div>
      ) : null}
      {children}
    </SellerShell>
  );
}

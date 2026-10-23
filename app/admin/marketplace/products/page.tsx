import Link from "next/link";
import { BadgeCheck, Clock3, PackageSearch } from "lucide-react";
import { listAdminMarketplaceProducts } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";
import { ProductModerationControls } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marketplace Product Review | MeCart Admin" };

const tabs = ["", "PENDING", "APPROVED", "REJECTED"];

function tone(status: string) {
  if (status === "APPROVED") return "bg-emerald-400/10 text-emerald-300";
  if (status === "REJECTED") return "bg-rose-400/10 text-rose-300";
  return "bg-amber-400/10 text-amber-300";
}

export default async function AdminMarketplaceProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ approval?: string }>;
}) {
  const params = await searchParams;
  const products = await listAdminMarketplaceProducts(params.approval);
  const pending = products.filter((product) => product.approval_status === "PENDING").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Marketplace</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Product review</h1>
          <p className="mt-1 text-sm text-slate-400">Seller-owned products stay hidden until a staff member approves them.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-4 py-2 text-xs text-amber-200">
          <Clock3 className="h-3.5 w-3.5" /> {pending} pending in this view
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <Link
            key={tab || "ALL"}
            href={`/admin/marketplace/products${tab ? `?approval=${tab}` : ""}`}
            className={`rounded-full px-3.5 py-2 text-[11px] font-medium transition ${(params.approval ?? "") === tab ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white" : "border border-white/10 text-slate-400 hover:text-white"}`}
          >
            {tab || "All marketplace products"}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Product</th>
                <th className="px-3 py-3.5 font-medium">Vendor / store</th>
                <th className="px-3 py-3.5 font-medium">Price</th>
                <th className="px-3 py-3.5 font-medium">Commission</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-3 py-3.5 font-medium">Submitted</th>
                <th className="px-5 py-3.5 text-right font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-slate-500"><PackageSearch className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${product.id}/edit`} className="block truncate font-medium text-white hover:text-cyan-200">{product.name}</Link>
                        <p className="mt-0.5 text-[10px] text-slate-500">{product.sku} · {product.vendor_sku || "no vendor SKU"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs">
                    <p className="text-slate-300">{product.vendorName || "—"}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{product.storeName || "No store"}</p>
                  </td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-200">{money(product.final_price)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-cyan-200">{product.commission_rate ? `${product.commission_rate}%` : "Default"}</td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${tone(product.approval_status)}`}>{product.approval_status}</span>
                    <p className="mt-1 text-[9px] text-slate-600">{product.status}</p>
                  </td>
                  <td className="px-3 py-4 text-[10px] text-slate-500">{product.submitted_at ? dateLabel(product.submitted_at) : "—"}</td>
                  <td className="px-5 py-4"><ProductModerationControls productId={product.id} approval={product.approval_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="px-5 py-14 text-center">
            <BadgeCheck className="mx-auto h-7 w-7 text-emerald-300/60" />
            <p className="mt-3 text-sm text-slate-400">No marketplace products in this queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}

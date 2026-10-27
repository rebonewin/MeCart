import Link from "next/link";
import { AlertTriangle, Boxes, PackageCheck, Search } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerProducts } from "@/lib/repositories/seller";
import { money } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerEmpty, SellerPageHeader, SellerStat } from "@/components/seller/ui";
import { SellerStockEditor } from "@/components/seller/stock-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory | MeCart Seller" };

export default async function SellerInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const params = await searchParams;
  const context = await requireSellerContext();
  const { items, total } = await listSellerProducts(context.vendor.id, { search: params.q, limit: 100 });
  const filtered = params.view === "low" ? items.filter((product) => product.stock <= 5) : items;
  const low = items.filter((product) => product.stock <= 5);
  const out = items.filter((product) => product.stock === 0);
  const units = items.reduce((sum, product) => sum + product.stock, 0);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description="Stock is shared with the storefront immediately. Every adjustment is logged against your vendor account."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SellerStat label="Products tracked" value={String(total)} icon={Boxes} />
        <SellerStat label="Units on hand" value={units.toLocaleString("en-US")} icon={PackageCheck} />
        <SellerStat label="Low stock" value={String(low.length)} hint="5 units or fewer" tone={low.length ? "gold" : "default"} icon={AlertTriangle} />
        <SellerStat label="Out of stock" value={String(out.length)} tone={out.length ? "rose" : "default"} icon={AlertTriangle} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
          <Link href="/seller/inventory" className={`rounded-xl px-3.5 py-2 text-xs ${!params.view ? "bg-[#D4AF37] font-semibold text-[#0B0B0F]" : "text-slate-400 hover:text-white"}`}>All stock</Link>
          <Link href="/seller/inventory?view=low" className={`rounded-xl px-3.5 py-2 text-xs ${params.view === "low" ? "bg-[#D4AF37] font-semibold text-[#0B0B0F]" : "text-slate-400 hover:text-white"}`}>Low stock {low.length ? `(${low.length})` : ""}</Link>
        </div>
        <form className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          {params.view && <input type="hidden" name="view" value={params.view} />}
          <input name="q" defaultValue={params.q ?? ""} placeholder="Find a product or SKU" className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-4 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40 sm:w-64" />
        </form>
      </div>

      {filtered.length === 0 ? (
        <SellerEmpty title="No stock records" description="Products you create appear here with an editable stock count." />
      ) : (
        <SellerCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Product</th>
                  <th className="px-3 py-3.5 font-medium">Store</th>
                  <th className="px-3 py-3.5 font-medium">Price</th>
                  <th className="px-3 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-4">
                      <Link href={`/seller/products/${product.id}/edit`} className="font-medium text-white hover:text-[#E6C768]">{product.name}</Link>
                      <p className="mt-0.5 text-[11px] text-slate-600">{product.sku}</p>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-400">{product.storeName}</td>
                    <td className="px-3 py-4 tabular-nums text-slate-300">{money(product.price)}</td>
                    <td className="px-3 py-4"><SellerBadge tone={product.approvalStatus === "APPROVED" ? "success" : "warning"}>{product.approvalStatus}</SellerBadge></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3">
                        {product.stock <= 5 && <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300">{product.stock === 0 ? "Out" : "Low"}</span>}
                        <SellerStockEditor productId={product.id} stock={product.stock} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SellerCard>
      )}
    </div>
  );
}

import Link from "next/link";
import { Package, Search, Store } from "lucide-react";
import { listOwnershipProducts, listVendorStoreOptions } from "@/lib/repositories/admin-marketplace";
import { dateLabel, money } from "@/lib/marketplace/format";
import { OwnershipEditor } from "@/components/admin/marketplace/controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Ownership | MeCart Admin" };

export default async function AdminOwnershipPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const [products, options] = await Promise.all([
    listOwnershipProducts(params.q),
    listVendorStoreOptions(),
  ]);
  const platformOwned = products.filter((product) => !product.vendor_id).length;
  const marketplaceOwned = products.length - platformOwned;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Catalogue control</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Product ownership</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            Assign a platform product to a vendor or store, or return a marketplace product to platform ownership. Store
            attribution is validated against the selected vendor.
          </p>
        </div>
        <form className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search product or SKU"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          />
        </form>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Products in view", value: String(products.length), hint: params.q ? `Matching “${params.q}”` : "Most recent 300", icon: Package },
          { label: "Marketplace owned", value: String(marketplaceOwned), hint: "Vendor or store attributed", icon: Store },
          { label: "Platform owned", value: String(platformOwned), hint: "No vendor attribution", icon: Package },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-cyan-300" />
            </div>
            <p className="mt-3 text-xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-[10px] text-slate-600">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Ownership ledger</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Changes are audit-logged and notify the receiving vendor.</p>
          </div>
          <span className="text-[10px] text-slate-500">{options.vendors.length} vendors · {options.stores.length} stores</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-white/10 text-[9px] uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Product</th>
                <th className="px-3 py-3.5 font-medium">Current owner</th>
                <th className="px-3 py-3.5 font-medium">Store</th>
                <th className="px-3 py-3.5 font-medium">Price</th>
                <th className="px-3 py-3.5 font-medium">Commission</th>
                <th className="px-3 py-3.5 font-medium">Approval</th>
                <th className="px-3 py-3.5 font-medium">Updated</th>
                <th className="px-5 py-3.5 text-right font-medium">Assign</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.025]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-semibold text-slate-400">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${product.id}/edit`} className="block max-w-[280px] truncate font-medium text-white hover:text-cyan-200">
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-slate-500">{product.sku} · {product.vendor_sku || "no vendor SKU"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-300">
                    {product.vendorName || <span className="text-slate-600">Platform</span>}
                  </td>
                  <td className="px-3 py-4 text-xs text-slate-400">{product.storeName || "—"}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-slate-200">{money(product.final_price)}</td>
                  <td className="px-3 py-4 text-xs tabular-nums text-cyan-200">
                    {product.commission_rate !== null ? `${product.commission_rate}%` : "Vendor default"}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${product.approval_status === "APPROVED" ? "bg-emerald-400/10 text-emerald-300" : product.approval_status === "REJECTED" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-300"}`}>
                      {product.approval_status}
                    </span>
                    <p className="mt-1 text-[9px] text-slate-600">{product.status}</p>
                  </td>
                  <td className="px-3 py-4 text-[10px] text-slate-500">{dateLabel(product.updated_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <OwnershipEditor
                        productId={product.id}
                        vendorId={product.vendor_id}
                        storeId={product.store_id}
                        commissionRate={product.commission_rate}
                        vendorSku={product.vendor_sku}
                        vendors={options.vendors}
                        stores={options.stores}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="px-5 py-14 text-center">
            <Package className="mx-auto h-7 w-7 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">No products match this search.</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.04] p-5 text-xs leading-6 text-slate-400">
        <p className="font-semibold text-blue-200">Ownership rules</p>
        <p className="mt-1">
          Assigning a vendor stamps <code className="text-cyan-200">vendor_id</code>, optional{" "}
          <code className="text-cyan-200">store_id</code> and a commission snapshot default. The public storefront only
          exposes products whose vendor and store are approved and active, and removed vendors fall back to platform
          ownership without deleting the product.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Search, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerProducts } from "@/lib/repositories/seller";
import { money, dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerButton, SellerEmpty, SellerPageHeader, sellerStatusTone } from "@/components/seller/ui";
import { SellerProductRowActions } from "@/components/seller/product-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products | MeCart Seller" };

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; approval?: string; page?: string }>;
}) {
  const params = await searchParams;
  const context = await requireSellerContext();
  const page = Math.max(1, Number(params.page ?? 1));
  const limit = 20;
  const { items, total } = await listSellerProducts(context.vendor.id, {
    search: params.q?.trim(),
    status: params.status,
    approval: params.approval,
    limit,
    offset: (page - 1) * limit,
  });
  const pages = Math.max(1, Math.ceil(total / limit));
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.approval) query.set("approval", params.approval);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Create, price and submit marketplace pieces. Seller-created products are reviewed by MeCart before going live."
        actions={<SellerButton href="/seller/products/new">New product</SellerButton>}
      />

      <form className="flex flex-col gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by name, SKU or vendor SKU…"
            className="h-11 w-full rounded-2xl border border-white/[0.07] bg-[#07090f] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#d8b45a]/40"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Lifecycle status</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <select name="status" defaultValue={params.status ?? ""} className="h-11 rounded-2xl border border-white/[0.07] bg-[#07090f] pl-9 pr-8 text-xs text-slate-300 outline-none">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </label>
          <select name="approval" defaultValue={params.approval ?? ""} className="h-11 rounded-2xl border border-white/[0.07] bg-[#07090f] px-3 text-xs text-slate-300 outline-none">
            <option value="">All approvals</option>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <button type="submit" className="h-11 rounded-2xl bg-[#d8b45a] px-5 text-xs font-semibold text-[#1e1708] transition hover:bg-[#e7c778]">
            Filter
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>{total} {total === 1 ? "product" : "products"}</p>
        <p>Page {page} of {pages}</p>
      </div>

      {items.length === 0 ? (
        <SellerEmpty
          title={params.q || params.status || params.approval ? "No matching products" : "Your catalogue is waiting"}
          description={
            params.q || params.status || params.approval
              ? "Clear the filters or try a different search."
              : "Add your first piece, connect it to a store and submit it for review."
          }
          action={<SellerButton href="/seller/products/new">Create a product</SellerButton>}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Product</th>
                  <th className="px-3 py-3.5 font-medium">Store</th>
                  <th className="px-3 py-3.5 font-medium">Price</th>
                  <th className="px-3 py-3.5 font-medium">Stock</th>
                  <th className="px-3 py-3.5 font-medium">Approval</th>
                  <th className="px-3 py-3.5 font-medium">Updated</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((product) => (
                  <tr key={product.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-slate-600"><ShoppingBag className="h-5 w-5" /></span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/seller/products/${product.id}/edit`} className="block truncate font-medium text-white transition hover:text-[#f5dfa2]">
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {product.sku}{product.vendorSku && product.vendorSku !== product.sku ? ` · ${product.vendorSku}` : ""} · {product.categoryName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-400">{product.storeName}</td>
                    <td className="px-3 py-4">
                      <p className="tabular-nums text-slate-200">{money(product.price)}</p>
                      {product.compareAt > product.price ? (
                        <p className="text-[10px] text-slate-600 line-through">{money(product.compareAt)}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-4">
                      <span className={product.stock <= 5 ? "font-semibold text-rose-300" : "text-slate-300"}>{product.stock}</span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <SellerBadge tone={sellerStatusTone(product.approvalStatus)}>{product.approvalStatus}</SellerBadge>
                        <span className="text-[10px] text-slate-600">{product.status}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-500">{dateLabel(product.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <SellerProductRowActions productId={product.id} approvalStatus={product.approvalStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          {page > 1 && (
            <Link href={`/seller/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-300 hover:border-[#d8b45a]/40">
              Previous
            </Link>
          )}
          {page < pages && (
            <Link href={`/seller/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`} className="rounded-full border border-white/10 px-4 py-2 text-slate-300 hover:border-[#d8b45a]/40">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

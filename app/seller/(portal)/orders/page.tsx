import Link from "next/link";
import { Search, Package } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { listSellerOrders } from "@/lib/repositories/seller";
import { money, dateLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerEmpty, SellerPageHeader, sellerStatusTone } from "@/components/seller/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders | MeCart Seller" };

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const context = await requireSellerContext();
  const orders = await listSellerOrders(context.vendor.id, {
    status: params.status,
    search: params.q,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <SellerPageHeader
        eyebrow="Sales"
        title="Orders"
        description="Only your allocations appear here. Manage fulfilment, tracking and customer context without seeing other sellers' items."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/seller/orders${tab.value ? `?status=${tab.value}` : ""}`}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                (params.status ?? "") === tab.value
                  ? "bg-[#D4AF37] text-[#0B0B0F]"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <form className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          {params.status && <input type="hidden" name="status" value={params.status} />}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search order or customer"
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-9 pr-4 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40 lg:w-64"
          />
        </form>
      </div>

      {orders.length === 0 ? (
        <SellerEmpty
          title="No orders in this view"
          description="When a customer buys from your store, the vendor-scoped allocation appears here with fulfilment controls."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Order</th>
                  <th className="px-3 py-3.5 font-medium">Customer</th>
                  <th className="px-3 py-3.5 font-medium">Items</th>
                  <th className="px-3 py-3.5 font-medium">Your subtotal</th>
                  <th className="px-3 py-3.5 font-medium">Commission</th>
                  <th className="px-3 py-3.5 font-medium">Fulfilment</th>
                  <th className="px-3 py-3.5 font-medium">Placed</th>
                  <th className="px-5 py-3.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {orders.map(({ allocation, order, items }) => (
                  <tr key={allocation.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{order.order_number}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-600">{order.payment_status}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-slate-200">{order.customer_name}</p>
                      <p className="text-[11px] text-slate-600">{order.customer_email}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-400">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td className="px-3 py-4 tabular-nums text-slate-200">{money(allocation.subtotal)}</td>
                    <td className="px-3 py-4">
                      <p className="text-xs text-slate-400">{allocation.commission_rate}%</p>
                      <p className="text-[10px] text-slate-600">-{money(allocation.commission_amount)}</p>
                    </td>
                    <td className="px-3 py-4"><SellerBadge tone={sellerStatusTone(allocation.fulfillment_status)}>{allocation.fulfillment_status}</SellerBadge></td>
                    <td className="px-3 py-4 text-xs text-slate-500">{dateLabel(order.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/seller/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#E6C768] hover:underline">
                        Open <Package className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

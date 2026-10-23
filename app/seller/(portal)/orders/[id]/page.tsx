import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Receipt, User } from "lucide-react";
import { requireSellerContext } from "@/lib/marketplace/context";
import { getSellerOrder } from "@/lib/repositories/seller";
import { money, dateTimeLabel } from "@/lib/marketplace/format";
import { SellerBadge, SellerCard, SellerPageHeader, sellerStatusTone } from "@/components/seller/ui";
import { SellerFulfillmentForm } from "@/components/seller/fulfillment-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Detail | MeCart Seller" };

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireSellerContext();
  const result = await getSellerOrder(context.vendor.id, id);
  if (!result) notFound();
  const { allocation, order, items } = result;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/seller/orders" className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
        <SellerPageHeader
          eyebrow="Order allocation"
          title={order.order_number}
          description={`Placed ${dateTimeLabel(order.created_at)} · ${order.customer_email}`}
          actions={<SellerBadge tone={sellerStatusTone(allocation.fulfillment_status)}>{allocation.fulfillment_status}</SellerBadge>}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-5">
          <SellerCard className="overflow-hidden p-0">
            <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <h3 className="text-sm font-semibold text-white">Your items</h3>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {[item.size, item.color].filter(Boolean).join(" · ") || "Standard"} · Qty {item.quantity}
                    </p>
                    {item.vendor_sku ? <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-slate-600">SKU {item.vendor_sku}</p> : null}
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-slate-200">{money(item.total)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-white/[0.07] bg-white/[0.015] px-5 py-4 text-sm sm:px-6">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="tabular-nums">{money(allocation.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Marketplace commission ({allocation.commission_rate}%)</span><span className="tabular-nums">-{money(allocation.commission_amount)}</span></div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2.5 font-semibold text-[#f5dfa2]"><span>Your earnings</span><span className="tabular-nums">{money(allocation.vendor_earnings)}</span></div>
            </div>
          </SellerCard>

          <SellerCard>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#d8b45a]" />
              <h3 className="text-sm font-semibold text-white">Fulfilment</h3>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Updating this allocation does not expose other sellers&apos; items. Tracking details are shared with the customer.
            </p>
            <div className="mt-5">
              <SellerFulfillmentForm
                allocationId={allocation.id}
                status={allocation.fulfillment_status}
                carrier={allocation.carrier}
                trackingNumber={allocation.tracking_number}
                trackingUrl={allocation.tracking_url}
              />
            </div>
          </SellerCard>
        </div>

        <div className="space-y-5">
          <SellerCard>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#d8b45a]" />
              <h3 className="text-sm font-semibold text-white">Customer</h3>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Name</dt><dd className="mt-0.5 text-slate-200">{order.customer_name}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Email</dt><dd className="mt-0.5 break-all text-slate-300">{order.customer_email}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Phone</dt><dd className="mt-0.5 text-slate-300">{order.customer_phone || "—"}</dd></div>
            </dl>
          </SellerCard>

          <SellerCard>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#d8b45a]" />
              <h3 className="text-sm font-semibold text-white">Ship to</h3>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{order.shipping_address}</p>
            <p className="mt-2 text-sm text-slate-500">{order.city} {order.zip}</p>
            {order.notes ? (
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Order note</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{order.notes}</p>
              </div>
            ) : null}
          </SellerCard>

          <SellerCard>
            <h3 className="text-sm font-semibold text-white">Customer order total</h3>
            <p className="mt-1 text-[11px] text-slate-500">Across all sellers, for context only.</p>
            <p className="mt-4 text-2xl font-semibold tabular-nums text-white">{money(order.grand_total, order.currency)}</p>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between"><span>Payment</span><span className="text-slate-300">{order.payment_status}</span></div>
              <div className="flex justify-between"><span>Order status</span><span className="text-slate-300">{order.status}</span></div>
              <div className="flex justify-between"><span>Invoice</span><span className="text-slate-300">{order.invoice_number}</span></div>
            </div>
          </SellerCard>
        </div>
      </div>
    </div>
  );
}

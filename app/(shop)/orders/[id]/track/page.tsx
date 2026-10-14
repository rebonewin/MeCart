import { getOrderById } from "@/lib/actions/orders";
import Link from "next/link";

export const dynamic = "force-dynamic";

const steps = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  const currentIndex = steps.indexOf(order.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Track Order {order.orderNumber}</h1>
      <div className="mt-6 space-y-4">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${idx <= currentIndex ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${idx <= currentIndex ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>{step}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link href={`/orders/${order.id}`} className="rounded-md border px-4 py-2 text-sm">Back to Order</Link>
      </div>
    </div>
  );
}

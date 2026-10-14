import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = String(sp.orderId ?? "");
  const orderNumber = String(sp.orderNumber ?? "");
  const invoiceNumber = String(sp.invoiceNumber ?? "");
  const paymentId = String(sp.paymentId ?? "");
  const transactionId = String(sp.transactionId ?? "");
  const status = String(sp.status ?? "");
  const total = String(sp.total ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="text-6xl">✅</div>
      <h1 className="mt-4 text-3xl font-bold">Payment Successful</h1>
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-left text-sm dark:border-gray-800 dark:bg-gray-900">
        <p><span className="font-medium">Order Number:</span> {orderNumber}</p>
        <p><span className="font-medium">Invoice Number:</span> {invoiceNumber}</p>
        <p><span className="font-medium">Payment ID:</span> {paymentId}</p>
        <p><span className="font-medium">Transaction ID:</span> {transactionId}</p>
        <p><span className="font-medium">Payment Status:</span> {status}</p>
        <p><span className="font-medium">Total:</span> ${total}</p>
        <p><span className="font-medium">Estimated Delivery:</span> 3-5 business days</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="rounded-md bg-indigo-600 px-4 py-2 text-white">Continue Shopping</Link>
        <Link href={orderId ? `/orders/${orderId}` : "/orders"} className="rounded-md border px-4 py-2">View Order</Link>
        <Link href={orderId ? `/orders/${orderId}/invoice` : "#"} className="rounded-md border px-4 py-2">Download Invoice</Link>
      </div>
    </div>
  );
}


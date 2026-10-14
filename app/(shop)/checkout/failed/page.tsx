export const dynamic = "force-dynamic";

export default async function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orderId = String(sp.orderId ?? "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="text-6xl">❌</div>
      <h1 className="mt-4 text-3xl font-bold">Payment Failed</h1>
      <p className="mt-2 text-gray-600">Your payment could not be processed. Please try again.</p>
      {orderId && <p className="mt-2 text-sm text-gray-500">Order reference: {orderId}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/checkout" className="rounded-md bg-indigo-600 px-4 py-2 text-white">Retry Payment</a>
        <a href="/checkout" className="rounded-md border px-4 py-2">Change Payment Method</a>
        <a href="/cart" className="rounded-md border px-4 py-2">Go Back</a>
      </div>
    </div>
  );
}

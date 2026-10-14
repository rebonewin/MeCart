/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/actions/orders";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [upiVerified, setUpiVerified] = useState(false);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      billingAddress: "",
      city: "",
      zip: "",
      paymentMethod: "COD",
      cardHolder: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      upiId: "",
      bank: "",
      items: cart.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        size: i.size ?? "",
        color: i.color ?? "",
        price: i.price,
        coverImage: i.image,
      })),
    },
  });

  const pm = form.watch("paymentMethod");

  const onSubmit = async (values: CheckoutInput) => {
    if (cart.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await createOrder(values);
      cart.clear();
      if (res.paymentStatus === "PAID" || values.paymentMethod === "COD") {
        const qs = new URLSearchParams({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          invoiceNumber: res.invoiceNumber,
          paymentId: res.paymentId,
          transactionId: res.transactionId,
          status: res.paymentStatus,
          total: String(res.grandTotal),
        });
        router.push(`/order-success?${qs.toString()}`);
      } else {
        const qs = new URLSearchParams({ orderId: res.orderId });
        router.push(`/checkout/failed?${qs.toString()}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
      setProcessing(false);
    }
  };

  if (cart.items.length === 0 && !processing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No items to checkout</h1>
      </div>
    );
  }

  if (processing) {
    const steps = ["Processing Payment...", "Verifying Details...", "Creating Order...", "Updating Inventory...", "Generating Invoice..."];
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <div className="mt-6 space-y-2 text-center">
          {steps.map((s, idx) => (
            <p key={s} className="text-sm text-gray-600 animate-pulse" style={{ animationDelay: `${idx * 0.3}s` }}>
              {s}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const tax = Math.round(subtotal * 0.08);
  const shipping = subtotal > 0 ? 49 : 0;
  const total = subtotal + tax + shipping;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1 Shipping */}
          {step === 1 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold">1. Shipping Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input {...form.register("customerName")} placeholder="Full name" className="rounded border px-3 py-2 dark:bg-gray-800" />
                <input {...form.register("customerEmail")} placeholder="Email" className="rounded border px-3 py-2 dark:bg-gray-800" />
                <input {...form.register("customerPhone")} placeholder="Phone" className="rounded border px-3 py-2 dark:bg-gray-800" />
                <input {...form.register("zip")} placeholder="ZIP" className="rounded border px-3 py-2 dark:bg-gray-800" />
              </div>
              <textarea {...form.register("shippingAddress")} placeholder="Shipping address" className="mt-4 w-full rounded border px-3 py-2 dark:bg-gray-800" rows={3} />
              <input {...form.register("city")} placeholder="City" className="mt-4 w-full rounded border px-3 py-2 dark:bg-gray-800" />
              <textarea {...form.register("billingAddress")} placeholder="Billing address (optional)" className="mt-4 w-full rounded border px-3 py-2 dark:bg-gray-800" rows={2} />
              <button type="button" onClick={() => setStep(2)} className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Continue</button>
            </div>
          )}

          {/* Step 2 Payment Method */}
          {step === 2 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold">2. Payment Method</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["COD", "Cash on Delivery"],
                  ["UPI", "UPI (Demo)"],
                  ["CARD", "Credit / Debit Card (Demo)"],
                  ["NETBANKING", "Net Banking (Demo)"],
                ].map(([v, label]) => (
                  <label key={v} className="flex items-center gap-2">
                    <input type="radio" value={v} {...form.register("paymentMethod")} /> {label}
                  </label>
                ))}
              </div>

              {pm === "COD" && <div className="mt-4 rounded bg-gray-100 p-3 text-sm dark:bg-gray-800">Cash will be collected at delivery.</div>}

              {pm === "UPI" && (
                <div className="mt-4 space-y-2">
                  <input {...form.register("upiId")} placeholder="demo@upi" className="w-full rounded border px-3 py-2 dark:bg-gray-800" />
                  <button type="button" onClick={() => { if (form.getValues("upiId")) setUpiVerified(true); else toast.error("Enter UPI ID"); }} className="rounded-md border px-3 py-2 text-sm">
                    Verify UPI
                  </button>
                  {upiVerified && <p className="text-xs text-emerald-600">UPI verified (demo)</p>}
                </div>
              )}

              {pm === "CARD" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input {...form.register("cardHolder")} placeholder="Card holder name" className="rounded border px-3 py-2 dark:bg-gray-800" />
                  <input {...form.register("cardNumber")} placeholder="Card number (16 digits)" maxLength={16} className="rounded border px-3 py-2 dark:bg-gray-800" />
                  <input {...form.register("expiryMonth")} placeholder="MM" maxLength={2} className="rounded border px-3 py-2 dark:bg-gray-800" />
                  <input {...form.register("expiryYear")} placeholder="YY" maxLength={4} className="rounded border px-3 py-2 dark:bg-gray-800" />
                  <input {...form.register("cvv")} placeholder="CVV" maxLength={3} className="rounded border px-3 py-2 dark:bg-gray-800" />
                </div>
              )}

              {pm === "NETBANKING" && (
                <div className="mt-4">
                  <select {...form.register("bank")} className="w-full rounded border px-3 py-2 dark:bg-gray-800">
                    <option value="">Select bank</option>
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Punjab National Bank</option>
                    <option>Kotak Mahindra</option>
                  </select>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-md border px-4 py-2 text-sm">Back</button>
                <button type="button" onClick={() => setStep(3)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3 Review */}
          {step === 3 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold">3. Review Order</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {form.getValues("customerName")}</p>
                <p><span className="font-medium">Email:</span> {form.getValues("customerEmail")}</p>
                <p><span className="font-medium">Payment:</span> {pm}</p>
                <p><span className="font-medium">Items:</span> {cart.items.length}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="rounded-md border px-4 py-2 text-sm">Back</button>
                <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white">Pay ${total.toFixed(2)}</button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-gray-500">
            {cart.items.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>{i.name} x{i.quantity}</span>
                <span>${(i.price * i.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}


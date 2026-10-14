"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const cart = useCart();
  const shipping = cart.subtotal > 0 ? 49 : 0;
  const tax = Math.round(cart.subtotal * 0.08);
  const total = cart.subtotal + shipping + tax;

  const couponDiscount = 0;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-white">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Shopping Cart</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
              <div className="flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium hover:text-indigo-600">{item.name}</Link>
                <p className="text-xs text-gray-500">{item.size} / {item.color}</p>
                <p className="mt-1 font-semibold text-indigo-600">${item.price.toFixed(2)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center rounded border">
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity - 1, item.size, item.color)} className="px-2 py-1">-</button>
                    <span className="px-2">{item.quantity}</span>
                    <button onClick={() => cart.updateQuantity(item.productId, item.quantity + 1, item.size, item.color)} className="px-2 py-1">+</button>
                  </div>
                  <button onClick={() => cart.removeItem(item.productId, item.size, item.color)} className="text-xs text-red-500">Remove</button>
                </div>
              </div>
              <div className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            {couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Coupon</span><span>-${couponDiscount.toFixed(2)}</span></div>}
            <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <input placeholder="Coupon code" className="mt-4 w-full rounded border px-2 py-1.5 text-sm dark:bg-gray-800" />
          <Link href="/checkout" className="mt-4 block rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

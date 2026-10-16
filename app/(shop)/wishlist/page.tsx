"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";

export default function WishlistPage() {
  const wishlist = useWishlist();
  const cart = useCart();

  if (wishlist.items.length === 0) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Wishlist is empty</h1></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {wishlist.items.map((item) => (
          <div key={item.productId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="relative aspect-square">
              <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
            </div>
            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
              <p className="mt-1 text-sm font-semibold text-indigo-600">${item.price.toFixed(2)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    void cart.addItem({
                      productId: item.productId,
                      name: item.name,
                      slug: item.slug,
                      price: item.price,
                      image: item.image,
                      quantity: 1,
                    });
                  }}
                  className="flex-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs text-white"
                >
                  Move to Cart
                </button>
                <button onClick={() => void wishlist.remove(item.productId)} className="rounded-md border border-gray-300 px-2 py-1.5 text-xs">Remove</button>
              </div>
              <Link href={`/products/${item.slug}`} className="mt-2 block text-xs text-indigo-600">View</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

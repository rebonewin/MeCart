"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const wishlist = useWishlist();

  const price = product.finalPrice;
  const inWishlist = wishlist.has(product.id);

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        </div>
      </Link>
      <div className="p-3">
        <p className="text-xs text-gray-500">{product.brandName}</p>
        <Link href={`/products/${product.slug}`} className="mt-1 line-clamp-2 text-sm font-medium hover:text-indigo-600">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
          <span>★ {product.rating.toFixed(1)}</span>
          <span className="text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-600">${price.toFixed(2)}</span>
          {product.discountPercent > 0 && (
            <span className="text-xs text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() =>
              cart.addItem({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price,
                image: product.coverImage,
                quantity: 1,
                size: product.sizes[0],
                color: product.colors[0],
              })
            }
            className="flex-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() =>
              wishlist.toggle({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price,
                image: product.coverImage,
              })
            }
            className={`rounded-md border px-2 py-1.5 text-xs ${inWishlist ? "border-red-300 text-red-500" : "border-gray-300 text-gray-600"}`}
            aria-label="wishlist"
          >
            {inWishlist ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </div>
  );
}

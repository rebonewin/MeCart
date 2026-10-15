"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/types/product";

export function ProductCardHome({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  return (
    <motion.article
      whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
      className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900"
      style={{ transformStyle: "preserve-3d" }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={product.coverImage}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-110"
          />
          {product.discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              -{product.discountPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggle({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.finalPrice,
                image: product.coverImage,
              });
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-md backdrop-blur transition hover:scale-110 dark:bg-gray-900/90"
            aria-label="Toggle wishlist"
          >
            {has(product.id) ? "♥" : "♡"}
          </button>
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">{product.brandName}</p>
        <Link href={`/products/${product.slug}`} className="mt-1 block line-clamp-2 min-h-12 font-semibold leading-6">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-sm text-amber-500">
          {"★".repeat(Math.round(product.rating))}
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-2xl font-black text-gray-900 dark:text-white">${product.finalPrice.toFixed(2)}</span>
          {product.originalPrice !== product.finalPrice && (
            <span className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.finalPrice,
              image: product.coverImage,
              quantity: 1,
              size: product.sizes[0],
              color: product.colors[0],
            })
          }
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Add to Cart
        </button>
      </div>
    </motion.article>
  );
}

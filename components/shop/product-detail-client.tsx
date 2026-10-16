"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types/product";

export function ProductDetailClient({
  product,
  related = [],
}: {
  product: Product;
  related?: Product[];
}) {
  const cart = useCart();
  const wishlist = useWishlist();
  const router = useRouter();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const size = selectedSize || (product.sizes[0] ?? "");
  const color = selectedColor || (product.colors[0] ?? "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Image
              src={product.images[activeImage]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`overflow-hidden rounded-lg border ${i === activeImage ? "border-indigo-500" : "border-transparent"}`}>
                <Image src={img} alt="" width={160} height={160} className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">{product.brandName}</p>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-500">
            <span>★ {product.rating.toFixed(1)}</span>
            <span className="text-gray-400">({product.reviewCount} reviews)</span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-600">${product.finalPrice.toFixed(2)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-sm text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
                <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600">
                  -{product.discountPercent}%
                </span>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{product.description}</p>

          <div className="mt-6">
            <p className="text-sm font-medium">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)} className={`rounded-md border px-3 py-1.5 text-sm ${size === s ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)} className={`rounded-md border px-3 py-1.5 text-sm ${color === c ? "border-indigo-600 bg-indigo-50 text-indigo-600" : "border-gray-300"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm font-medium">Qty</p>
            <div className="flex items-center rounded border">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-1.5">-</button>
              <span className="px-3">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-1.5">+</button>
            </div>
            <span className="text-xs text-gray-500">{product.stock} in stock</span>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                cart.addItem({
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.finalPrice,
                  image: product.coverImage,
                  quantity,
                  size,
                  color,
                });
              }}
              className="flex-1 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Add to Cart
            </button>
            <button
              onClick={() => {
                cart.addItem({
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.finalPrice,
                  image: product.coverImage,
                  quantity,
                  size,
                  color,
                });
                router.push("/checkout");
              }}
              className="flex-1 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Buy Now
            </button>
            <button
              onClick={() =>
                wishlist.toggle({
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.finalPrice,
                  image: product.coverImage,
                })
              }
              className="rounded-md border border-gray-300 px-3 py-2.5 text-sm"
            >
              {wishlist.has(product.id) ? "♥" : "♡"}
            </button>
          </div>

          <div className="mt-6 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
            <p><span className="font-medium">Estimated delivery:</span> 3-5 business days</p>
            <p><span className="font-medium">Return policy:</span> 7-day easy returns</p>
            <p><span className="font-medium">Material:</span> {product.material}</p>
            <p><span className="font-medium">Country of origin:</span> {product.country}</p>
            <p><span className="font-medium">Weight:</span> {product.weight} kg</p>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Related Products</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}

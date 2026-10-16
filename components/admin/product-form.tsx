/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productSchema, type ProductFormValues } from "@/lib/validators/product";
import { createProduct, updateProduct } from "@/lib/actions/products";

type Sub = { id: string; name: string; categorySlug?: string; slug?: string; categoryId?: string; category?: { id: string } };

export function ProductForm({
  mode,
  product,
  categories,
  brands,
  subCategories,
}: {
  mode: "create" | "edit";
  product?: any;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  subCategories: Sub[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(
    product?.images?.map((i: { url: string }) => i.url) ?? [],
  );
  const [uploading, setUploading] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      description: product?.description ?? "",
      material: product?.material ?? "",
      country: product?.country ?? "",
      weight: product?.weight ?? undefined,
      stock: product?.stock ?? 0,
      sizes: product?.sizes?.join(", ") ?? "XS, S, M, L, XL, XXL",
      colors: product?.colors?.join(", ") ?? "Black, White",
      rating: product?.rating ?? 4.5,
      reviewCount: product?.reviewCount ?? 0,
      originalPrice: product?.originalPrice ?? 0,
      discountPercent: product?.discountPercent ?? 0,
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      subCategoryId: product?.subCategoryId ?? "",
      brandId: product?.brandId ?? "",
      status: product?.status ?? "ACTIVE",
      featured: product?.featured ?? false,
      bestSeller: product?.bestSeller ?? false,
      newArrival: product?.newArrival ?? false,
      images: [],
    },
  });

  const watchedCategory = useWatch({ control: form.control, name: "categoryId" });
  const filteredSubs = subCategories.filter((s) => (s.categoryId ?? s.category?.id) === watchedCategory);

  useEffect(() => {
    form.setValue("images", images);
  }, [images, form]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    const data = await res.json();
    setImages((prev) => [...prev, ...data.urls]);
    toast.success("Images uploaded");
  };

  const onSubmit = async (values: ProductFormValues) => {
    const payload = { ...values, images };
    try {
      if (mode === "create") {
        await createProduct(payload);
        toast.success("Product created");
      } else if (product?.id) {
        await updateProduct(product.id, payload);
        toast.success("Product updated");
      }
      router.push("/admin/products");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input {...form.register("name")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
          {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">SKU</label>
          <input {...form.register("sku")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
          {form.formState.errors.sku && <p className="text-xs text-red-500">{form.formState.errors.sku.message}</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea {...form.register("description")} rows={4} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Original Price</label>
          <input type="number" step="0.01" {...form.register("originalPrice")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm font-medium">Discount %</label>
          <input type="number" {...form.register("discountPercent")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm font-medium">Stock</label>
          <input type="number" {...form.register("stock")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm font-medium">Rating</label>
          <input type="number" step="0.1" {...form.register("rating")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Material</label>
          <input {...form.register("material")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm font-medium">Country</label>
          <input {...form.register("country")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm font-medium">Weight (kg)</label>
          <input type="number" step="0.01" {...form.register("weight")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Sizes (comma separated)</label>
          <input {...form.register("sizes")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
          {form.formState.errors.sizes && <p className="text-xs text-red-500">{form.formState.errors.sizes.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Colors (comma separated)</label>
          <input {...form.register("colors")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800" />
          {form.formState.errors.colors && <p className="text-xs text-red-500">{form.formState.errors.colors.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Category</label>
          <select {...form.register("categoryId")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Subcategory</label>
          <select {...form.register("subCategoryId")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800">
            <option value="">None</option>
            {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.slug}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Brand</label>
          <select {...form.register("brandId")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800">
            <option value="">None</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>
        <select {...form.register("status")} className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-800">
          <option value="ACTIVE">ACTIVE</option>
          <option value="DRAFT">DRAFT</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" {...form.register("featured")} /> Featured</label>
        <label className="flex items-center gap-2"><input type="checkbox" {...form.register("bestSeller")} /> Best Seller</label>
        <label className="flex items-center gap-2"><input type="checkbox" {...form.register("newArrival")} /> New Arrival</label>
      </div>

      <div>
        <label className="text-sm font-medium">Images</label>
        <input type="file" multiple accept="image/*" onChange={onUpload} className="mt-1" />
        {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative aspect-square">
              <Image src={url} alt="" fill sizes="120px" className="rounded object-cover" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">✕</button>
            </div>
          ))}
        </div>
        {form.formState.errors.images && <p className="text-xs text-red-500">{form.formState.errors.images.message}</p>}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          {mode === "create" ? "Create Product" : "Update Product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-md border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}



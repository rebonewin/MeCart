"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Save, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { createSellerProduct, updateSellerProduct, type SellerProductInput } from "@/lib/actions/seller-products";
import { cn } from "@/lib/cn";

const field =
  "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#D4AF37]/45 focus:ring-4 focus:ring-[#D4AF37]/10";
const label = "mb-1.5 block text-xs font-medium text-slate-300";

type Option = { id: string; name: string };
type StoreOption = { id: string; name: string };
type Initial = {
  productId?: string;
  name: string;
  sku: string;
  vendorSku: string;
  description: string;
  material: string;
  country: string;
  weight: string;
  stock: string;
  sizes: string;
  colors: string;
  originalPrice: string;
  discountPercent: string;
  categoryId: string;
  subCategoryId: string;
  brandId: string;
  storeId: string;
  status: "ACTIVE" | "DRAFT" | "HIDDEN";
  approvalStatus: string;
  images: string[];
};

const EMPTY: Initial = {
  name: "",
  sku: "",
  vendorSku: "",
  description: "",
  material: "",
  country: "",
  weight: "1",
  stock: "0",
  sizes: "One size",
  colors: "Natural",
  originalPrice: "",
  discountPercent: "0",
  categoryId: "",
  subCategoryId: "",
  brandId: "",
  storeId: "",
  status: "DRAFT",
  approvalStatus: "PENDING",
  images: [],
};

export function SellerProductForm({
  vendorId,
  stores,
  categories,
  subCategories,
  brands,
  initial,
}: {
  vendorId: string;
  stores: StoreOption[];
  categories: Option[];
  subCategories: Option[];
  brands: Option[];
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Initial>({
    ...EMPTY,
    ...initial,
    storeId: initial?.storeId || stores[0]?.id || "",
    categoryId: initial?.categoryId || categories[0]?.id || "",
  });

  const finalPrice = useMemo(() => {
    const price = Number(form.originalPrice || 0);
    const discount = Number(form.discountPercent || 0);
    return Math.max(0, Math.round((price * (100 - discount)) / 100) / 100);
  }, [form.originalPrice, form.discountPercent]);

  const set = (key: keyof Initial) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("files", file));
      body.set("bucket", "vendor-assets");
      body.set("folder", vendorId);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = (await response.json()) as { urls?: string[]; error?: string };
      if (!response.ok || !data.urls) throw new Error(data.error || "Upload failed");
      setForm((current) => ({ ...current, images: [...current.images, ...data.urls!].slice(0, 8) }));
      toast.success(`${data.urls.length} image${data.urls.length === 1 ? "" : "s"} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const value = imageUrl.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      toast.error("Enter a valid image URL.");
      return;
    }
    setForm((current) => ({ ...current, images: [...current.images, value].slice(0, 8) }));
    setImageUrl("");
  };

  const submit = () => {
    if (!form.name.trim() || !form.sku.trim() || !form.description.trim() || !form.categoryId) {
      toast.error("Name, SKU, description and category are required.");
      return;
    }
    if (!form.storeId) {
      toast.error("Create a store before adding products.");
      return;
    }
    if (!form.images.length) {
      toast.error("Add at least one product image.");
      return;
    }
    if (!Number(form.originalPrice)) {
      toast.error("Enter a valid price.");
      return;
    }

    const payload: SellerProductInput = {
      name: form.name,
      sku: form.sku,
      vendorSku: form.vendorSku,
      description: form.description,
      material: form.material,
      country: form.country,
      weight: Number(form.weight || 0),
      stock: Number(form.stock || 0),
      sizes: form.sizes,
      colors: form.colors,
      originalPrice: Number(form.originalPrice),
      discountPercent: Number(form.discountPercent || 0),
      categoryId: form.categoryId,
      subCategoryId: form.subCategoryId,
      brandId: form.brandId,
      status: form.status,
      images: form.images,
      storeId: form.storeId,
    };

    startTransition(async () => {
      try {
        if (initial?.productId) {
          await updateSellerProduct(initial.productId, payload);
          toast.success("Product updated.");
        } else {
          await createSellerProduct(payload);
          toast.success("Product created as a draft.");
        }
        router.push("/seller/products");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save product");
      }
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-white">The piece</h3>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="name">Product name</label>
              <input id="name" className={field} value={form.name} onChange={set("name")} placeholder="Hand-finished cashmere overshirt" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="sku">MeCart SKU</label>
                <input id="sku" className={field} value={form.sku} onChange={set("sku")} placeholder="AUR-OS-001" />
              </div>
              <div>
                <label className={label} htmlFor="vendorSku">Your SKU (optional)</label>
                <input id="vendorSku" className={field} value={form.vendorSku} onChange={set("vendorSku")} placeholder="Internal reference" />
              </div>
            </div>
            <div>
              <label className={label} htmlFor="description">Description</label>
              <textarea id="description" className={`${field} h-32 py-3`} value={form.description} onChange={set("description")} placeholder="Materials, construction, provenance and care." />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="material">Material</label>
                <input id="material" className={field} value={form.material} onChange={set("material")} placeholder="Cashmere" />
              </div>
              <div>
                <label className={label} htmlFor="country">Made in</label>
                <input id="country" className={field} value={form.country} onChange={set("country")} placeholder="Italy" />
              </div>
              <div>
                <label className={label} htmlFor="weight">Weight (kg)</label>
                <input id="weight" type="number" min="0" step="0.01" className={field} value={form.weight} onChange={set("weight")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="sizes">Sizes</label>
                <input id="sizes" className={field} value={form.sizes} onChange={set("sizes")} placeholder="XS, S, M, L" />
                <p className="mt-1 text-[10px] text-slate-600">Comma separated</p>
              </div>
              <div>
                <label className={label} htmlFor="colors">Colours</label>
                <input id="colors" className={field} value={form.colors} onChange={set("colors")} placeholder="Sand, Ink, Olive" />
                <p className="mt-1 text-[10px] text-slate-600">Comma separated</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-[#D4AF37]" />
            <h3 className="text-sm font-semibold text-white">Product imagery</h3>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Up to 8 images. The first image becomes the cover.</p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0B0B0F]">Cover</span>
                )}
                <Button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, position) => position !== index) }))}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {form.images.length < 8 && (
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-slate-500 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                <span className="text-[10px] font-medium">{uploading ? "Uploading" : "Upload"}</span>
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(event) => void uploadFiles(event.target.files)} />
          <div className="mt-3 flex gap-2">
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="Or paste an image URL"
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-[#D4AF37]/40"
            />
            <Button type="button" onClick={addUrl} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-slate-300 hover:border-[#D4AF37]/40">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white">Organisation</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label className={label} htmlFor="storeId">Store</label>
              <select id="storeId" className={field} value={form.storeId} onChange={set("storeId")}>
                {stores.length === 0 && <option value="">No stores yet</option>}
                {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="categoryId">Category</label>
              <select id="categoryId" className={field} value={form.categoryId} onChange={set("categoryId")}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="subCategoryId">Subcategory</label>
              <select id="subCategoryId" className={field} value={form.subCategoryId} onChange={set("subCategoryId")}>
                <option value="">None</option>
                {subCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="brandId">Brand / house</label>
              <select id="brandId" className={field} value={form.brandId} onChange={set("brandId")}>
                <option value="">No brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white">Pricing & inventory</h3>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="originalPrice">Price</label>
                <input id="originalPrice" type="number" min="0.01" step="0.01" className={field} value={form.originalPrice} onChange={set("originalPrice")} placeholder="0.00" />
              </div>
              <div>
                <label className={label} htmlFor="discountPercent">Discount %</label>
                <input id="discountPercent" type="number" min="0" max="100" className={field} value={form.discountPercent} onChange={set("discountPercent")} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <span className="text-xs text-slate-500">Customer price</span>
              <span className="text-lg font-semibold tabular-nums text-[#E6C768]">${finalPrice.toFixed(2)}</span>
            </div>
            <div>
              <label className={label} htmlFor="stock">Stock on hand</label>
              <input id="stock" type="number" min="0" step="1" className={field} value={form.stock} onChange={set("stock")} />
            </div>
            <div>
              <label className={label} htmlFor="status">Visibility</label>
              <select id="status" className={field} value={form.status} onChange={set("status")} disabled={form.approvalStatus !== "APPROVED"}>
                <option value="DRAFT">Draft</option>
                <option value="HIDDEN">Hidden</option>
                <option value="ACTIVE">Active</option>
              </select>
              {form.approvalStatus !== "APPROVED" && (
                <p className="mt-1.5 text-[10px] leading-4 text-slate-600">
                  Marketplace review controls your public visibility until the product is approved.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className={cn("rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] p-5", uploading && "opacity-70")}>
          <p className="text-xs leading-5 text-[#E6C768]/80">
            Saving creates a private draft. Use “Submit” on the products page when the imagery,
            price and stock are ready for MeCart review.
          </p>
          <Button
            type="button"
            onClick={submit}
            disabled={pending || uploading}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-[#0B0B0F] transition hover:bg-[#E6C768] disabled:opacity-55"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pending ? "Saving…" : initial?.productId ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </div>
    </div>
  );
}

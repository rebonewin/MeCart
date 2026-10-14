import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(3, "SKU is required"),
  description: z.string().min(10, "Description too short"),
  material: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  weight: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0),
  sizes: z.string().min(1, "Sizes required"),
  colors: z.string().min(1, "Colors required"),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().min(0).optional(),
  originalPrice: z.coerce.number().positive(),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
  categoryId: z.string().min(1, "Category required"),
  subCategoryId: z.string().optional().or(z.literal("")),
  brandId: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DRAFT", "HIDDEN"]),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  images: z.array(z.string().min(1)).min(1, "At least one image required"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
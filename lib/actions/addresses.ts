"use server";

import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/security/audit";
import { z } from "zod";
import {
  createAddress as repoCreateAddress,
  deleteAddress as repoDeleteAddress,
  updateAddress as repoUpdateAddress,
} from "@/lib/repositories/addresses";

const addressSchema = z.object({
  label: z.string().optional().or(z.literal("")),
  name: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(3),
  line2: z.string().optional().or(z.literal("")),
  city: z.string().min(2),
  state: z.string().min(2),
  zip: z.string().min(4),
  country: z.string().min(2),
  isDefault: z.boolean().optional(),
});

export async function createAddress(input: unknown) {
  const user = await requireUser();
  const v = addressSchema.parse(input);

  await repoCreateAddress(user.id, {
    label: v.label || null,
    name: v.name,
    phone: v.phone,
    line1: v.line1,
    line2: v.line2 || null,
    city: v.city,
    state: v.state,
    zip: v.zip,
    country: v.country,
    isDefault: v.isDefault ?? false,
  });

  await logActivity({ action: "ADDRESS_ADDED", resource: "Address", userId: user.id });
  revalidatePath("/profile");
}

export async function updateAddress(id: string, input: unknown) {
  const user = await requireUser();
  const v = addressSchema.parse(input);

  await repoUpdateAddress(user.id, id, {
    label: v.label || null,
    name: v.name,
    phone: v.phone,
    line1: v.line1,
    line2: v.line2 || null,
    city: v.city,
    state: v.state,
    zip: v.zip,
    country: v.country,
    isDefault: v.isDefault ?? false,
  });

  revalidatePath("/profile");
}

export async function deleteAddress(id: string) {
  const user = await requireUser();
  await repoDeleteAddress(user.id, id);
  await logActivity({ action: "ADDRESS_DELETED", resource: `Address:${id}`, userId: user.id });
  revalidatePath("/profile");
}

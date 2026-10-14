"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/security/audit";
import { z } from "zod";

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

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createAddress(input: unknown) {
  const userId = await requireUser();
  const v = addressSchema.parse(input);
  if (v.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  await prisma.address.create({
    data: {
      userId,
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
    },
  });
  const session = await auth();
  await logActivity({ action: "ADDRESS_ADDED", resource: `Address`, userId: session?.user?.id ?? null });
  revalidatePath("/profile");
}

export async function updateAddress(id: string, input: unknown) {
  const userId = await requireUser();
  const v = addressSchema.parse(input);
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  if (v.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  await prisma.address.update({
    where: { id },
    data: {
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
    },
  });
  revalidatePath("/profile");
}

export async function deleteAddress(id: string) {
  const userId = await requireUser();
  await prisma.address.deleteMany({ where: { id, userId } });
  await logActivity({ action: "ADDRESS_DELETED", resource: `Address:${id}`, userId });
  revalidatePath("/profile");
}

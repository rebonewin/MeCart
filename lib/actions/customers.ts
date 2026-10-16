"use server";

import { requireAdmin } from "@/lib/auth";
import { updateCustomer } from "@/lib/repositories/customers";
import { logAudit } from "@/lib/security/audit";
import type { AppRole } from "@/types/database";
import { revalidatePath } from "next/cache";

const ASSIGNABLE_ROLES: readonly AppRole[] = ["admin", "manager", "customer", "guest"];

export async function updateCustomerAction(
  userId: string,
  input: { fullName?: string; phone?: string; role?: string; isActive?: boolean },
) {
  const admin = await requireAdmin();
  if (!userId) throw new Error("Missing user id");

  if (input.role !== undefined && !ASSIGNABLE_ROLES.includes(input.role as AppRole)) {
    throw new Error("Invalid role");
  }

  const trimmedName = input.fullName?.trim();
  if (trimmedName !== undefined && trimmedName.length > 0 && trimmedName.length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  if (userId === admin.id && (input.role !== undefined || input.isActive !== undefined)) {
    throw new Error("You cannot change your own role or status");
  }

  const patch: {
    fullName?: string | null;
    phone?: string | null;
    role?: AppRole;
    isActive?: boolean;
  } = {};
  if (input.fullName !== undefined) patch.fullName = trimmedName || null;
  if (input.phone !== undefined) patch.phone = input.phone.trim() || null;
  if (input.role !== undefined) patch.role = input.role as AppRole;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  if (Object.keys(patch).length === 0) return;

  await updateCustomer(userId, patch);

  await logAudit({
    action: "UPDATE_CUSTOMER",
    resource: `user:${userId}`,
    newValue: JSON.stringify(patch),
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
}

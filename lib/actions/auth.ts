"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logActivity } from "@/lib/security/audit";

const registerSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerCustomer(input: unknown) {
  const v = registerSchema.parse(input);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: v.username }, { email: v.email }] },
  });
  if (existing) throw new Error("User already exists");

  const hashed = await bcrypt.hash(v.password, 12);
  const user = await prisma.user.create({
    data: {
      username: v.username,
      email: v.email,
      name: v.name,
      password: hashed,
      role: "USER",
    },
  });

  revalidatePath("/login");
  await logActivity({ action: "REGISTER", resource: `User:${user.id}`, userId: user.id, metadata: { username: user.username, email: user.email } });
  return user.id;
}

export async function updateProfile(input: { name?: string; email?: string; phone?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: input.name,
      email: input.email,
    },
  });
  await logActivity({ action: "PROFILE_UPDATE", resource: `User:${session.user.id}`, userId: session.user.id });
  revalidatePath("/profile");
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) throw new Error("User not found");

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
  await logActivity({ action: "PASSWORD_CHANGE", resource: `User:${user.id}`, userId: user.id });
}

export async function logoutAllDevices() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  // placeholder for session revocation; JWT strategy requires rotate secret in production
  return;
}

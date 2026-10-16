import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  username: string | null;
  avatarUrl: string | null;
};

export type AppSession = { user: SessionUser };

/**
 * Supabase-backed session accessor.
 * Drop-in replacement for the previous NextAuth `auth()` helper.
 */
export async function auth(): Promise<AppSession | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { user };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email ?? profile?.email ?? null,
      name: profile?.full_name ?? (user.user_metadata?.name as string | undefined) ?? null,
      role: profile?.role ?? "customer",
      username: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Unauthorized");
  return user;
}

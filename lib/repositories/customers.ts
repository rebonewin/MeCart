import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toNumber, unwrapList, unwrapVoid } from "@/lib/repositories/utils";
import type { NotificationRow, ProfileRow } from "@/types/database";

export type CustomerWithStats = {
  id: string;
  userId: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: ProfileRow["role"];
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  marketingOptIn: boolean;
};

export async function listCustomers(): Promise<CustomerWithStats[]> {
  const supabase = await createClient();
  const [profilesRes, customersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("customers").select("*"),
  ]);

  const customerMap = new Map((customersRes.data ?? []).map((c) => [c.user_id, c]));

  return (profilesRes.data ?? []).map((profile) => {
    const customer = customerMap.get(profile.id);
    return {
      id: customer?.id ?? profile.id,
      userId: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      role: profile.role,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      lastLoginAt: profile.last_login_at,
      totalOrders: customer?.total_orders ?? 0,
      totalSpent: toNumber(customer?.total_spent ?? 0),
      loyaltyPoints: customer?.loyalty_points ?? 0,
      marketingOptIn: customer?.marketing_opt_in ?? false,
    };
  });
}

export async function getCustomerStats(): Promise<{ total: number; active: number; staff: number; newThisMonth: number }> {
  const customers = await listCustomers();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return {
    total: customers.length,
    active: customers.filter((c) => c.isActive).length,
    staff: customers.filter((c) => c.role === "admin" || c.role === "manager").length,
    newThisMonth: customers.filter((c) => new Date(c.createdAt) >= monthStart).length,
  };
}

export async function listStaff() {
  const supabase = await createClient();
  const admins = unwrapList(await supabase.from("admins").select("*").is("deleted_at", null));
  if (!admins.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", admins.map((a) => a.user_id));

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return admins.map((admin) => ({
    ...admin,
    profile: profileMap.get(admin.user_id) ?? null,
  }));
}

export async function updateCustomer(
  userId: string,
  patch: { fullName?: string | null; phone?: string | null; isActive?: boolean; role?: ProfileRow["role"]; marketingOptIn?: boolean; loyaltyPoints?: number; notes?: string | null },
) {
  const supabase = await createClient();

  const profilePatch: Partial<ProfileRow> = {};
  if (patch.fullName !== undefined) profilePatch.full_name = patch.fullName;
  if (patch.phone !== undefined) profilePatch.phone = patch.phone;
  if (patch.isActive !== undefined) profilePatch.is_active = patch.isActive;
  if (patch.role !== undefined) profilePatch.role = patch.role;

  if (Object.keys(profilePatch).length) {
    unwrapVoid(await supabase.from("profiles").update(profilePatch).eq("id", userId));
  }

  const customerPatch: {
    marketing_opt_in?: boolean;
    loyalty_points?: number;
    notes?: string | null;
  } = {};
  if (patch.marketingOptIn !== undefined) customerPatch.marketing_opt_in = patch.marketingOptIn;
  if (patch.loyaltyPoints !== undefined) customerPatch.loyalty_points = patch.loyaltyPoints;
  if (patch.notes !== undefined) customerPatch.notes = patch.notes;

  if (Object.keys(customerPatch).length) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      unwrapVoid(await supabase.from("customers").update(customerPatch).eq("user_id", userId));
    } else {
      unwrapVoid(await supabase.from("customers").insert({ user_id: userId, ...customerPatch }));
    }
  }
}

export async function markLogin(userId: string) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", userId);
}

export type { NotificationRow };

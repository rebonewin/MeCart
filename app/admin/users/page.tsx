import { auth } from "@/lib/auth";
import { listStaff } from "@/lib/repositories/customers";
import { UsersTable, type StaffMember } from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

function formatLastLogin(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminUsersPage() {
  const [session, staff] = await Promise.all([auth(), listStaff()]);

  const members: StaffMember[] = staff.map((member) => ({
    userId: member.user_id,
    name: member.profile?.full_name ?? member.profile?.username ?? member.profile?.email ?? "Staff member",
    username: member.profile?.username ?? null,
    email: member.profile?.email ?? null,
    avatarUrl: member.profile?.avatar_url ?? null,
    role: member.profile?.role ?? "manager",
    isActive: member.profile?.is_active ?? true,
    lastLoginLabel: formatLastLogin(member.profile?.last_login_at ?? null),
    level: member.level,
    department: member.department,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-gray-500">Staff accounts with access to the admin console.</p>
      </div>
      <UsersTable members={members} currentUserId={session?.user.id ?? null} />
    </div>
  );
}

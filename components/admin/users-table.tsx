"use client";

import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCustomerAction } from "@/lib/actions/customers";
import type { AdminRow, AppRole } from "@/types/database";

export type StaffMember = {
  userId: string;
  name: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: AppRole;
  isActive: boolean;
  lastLoginLabel: string | null;
  level: AdminRow["level"];
  department: string | null;
};

const ROLES: readonly AppRole[] = ["admin", "manager", "customer", "guest"];

const ROLE_BADGE: Record<AppRole, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  customer: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  guest: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
};

const LEVEL_BADGE: Record<AdminRow["level"], string> = {
  owner: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  admin: ROLE_BADGE.admin,
  manager: ROLE_BADGE.manager,
  support: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
};

function initial(member: StaffMember): string {
  const source = member.name || member.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

export function UsersTable({
  members,
  currentUserId,
}: {
  members: StaffMember[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = (member: StaffMember, input: { role?: string; isActive?: boolean }, message: string) => {
    setBusyId(member.userId);
    startTransition(async () => {
      try {
        await updateCustomerAction(member.userId, input);
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update member");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="p-3">Member</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Level</th>
            <th className="p-3">Status</th>
            <th className="p-3">Last Login</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const isBusy = pending && busyId === member.userId;
            return (
              <tr key={member.userId} className="border-b border-gray-100 dark:border-gray-800">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <Image src={member.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {initial(member)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">
                        {member.name}
                        {isSelf && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                      </p>
                      {member.username && <p className="text-xs text-gray-500">@{member.username}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-3">{member.email ?? "—"}</td>
                <td className="p-3">
                  <select
                    value={member.role}
                    onChange={(event) =>
                      run(member, { role: event.target.value }, `${member.name} is now ${event.target.value}`)
                    }
                    disabled={isSelf || isBusy}
                    title={isSelf ? "You cannot change your own role" : undefined}
                    className="rounded border px-2 py-1 text-xs capitalize dark:bg-gray-800"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${LEVEL_BADGE[member.level]}`}>
                    {member.level}
                  </span>
                  {member.department && <p className="mt-1 text-xs text-gray-500">{member.department}</p>}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      member.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400"
                    }`}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">{member.lastLoginLabel ?? "Never"}</td>
                <td className="p-3">
                  <Button
                    onClick={() =>
                      run(
                        member,
                        { isActive: !member.isActive },
                        member.isActive ? `${member.name} deactivated` : `${member.name} activated`,
                      )
                    }
                    disabled={isSelf || isBusy}
                    title={isSelf ? "You cannot deactivate your own account" : undefined}
                    className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {member.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500">
                No staff members found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

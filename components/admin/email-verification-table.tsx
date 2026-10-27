"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resendEmailVerification, setAccountStatus } from "@/lib/actions/email-otp";

type UserRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  account_status: string | null;
  email_verified_at: string | null;
  verification_attempts: number | null;
  last_otp_sent_at: string | null;
  is_active: boolean | null;
  created_at: string;
  failed_otp_attempts?: number | null;
};

export function EmailVerificationTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending" | "failed">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = users.filter((user) => {
    const status = user.account_status ?? "pending_verification";
    const verified = Boolean(user.email_verified_at);
    const failed = (user.failed_otp_attempts ?? 0) > 0;
    if (filter === "verified" && !verified) return false;
    if (filter === "pending" && status !== "pending_verification") return false;
    if (filter === "failed" && !failed) return false;

    if (search.trim()) {
      const term = search.toLowerCase();
      const haystack = `${user.full_name ?? ""} ${user.username ?? ""} ${user.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const counts = useMemo(() => {
    const verified = users.filter((user) => Boolean(user.email_verified_at)).length;
    const pending = users.filter(
      (user) => (user.account_status ?? "pending_verification") === "pending_verification",
    ).length;
    const failed = users.filter((user) => (user.failed_otp_attempts ?? 0) > 0).length;
    return { all: users.length, verified, pending, failed };
  }, [users]);

  const runResend = (user: UserRow) => {
    setBusyId(user.id);
    startTransition(async () => {
      try {
        const result = await resendEmailVerification(user.id);
        if (result.ok) toast.success(result.message);
        else toast.error(result.error);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to resend");
      } finally {
        setBusyId(null);
      }
    });
  };

  const runDeactivate = (user: UserRow) => {
    setBusyId(user.id);
    startTransition(async () => {
      try {
        const result = await setAccountStatus(user.id, user.is_active ? "suspended" : "active");
        if (result.ok) toast.success(result.message);
        else toast.error(result.error);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update account");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or email"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 md:max-w-xs dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="flex gap-2">
          {(["all", "verified", "pending", "failed"] as const).map((item) => (
            <Button
              key={item}
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${filter === item ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"}`}
            >
              {item} · {counts[item]}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verified At</th>
              <th className="p-3">Last OTP Sent</th>
              <th className="p-3">Attempts (failed / total)</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isBusy = pending && busyId === user.id;
              const verified = Boolean(user.email_verified_at);
              const status = user.account_status ?? "pending_verification";
              const badge =
                status === "suspended"
                  ? { label: "Suspended", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" }
                  : verified
                    ? { label: "Verified", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" }
                    : status === "email_verified"
                      ? { label: "Email verified", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" }
                      : { label: "Pending", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" };
              return (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="font-medium">{user.full_name || user.username || "—"}</div>
                    {user.username && <div className="text-xs text-gray-500">@{user.username}</div>}
                  </td>
                  <td className="p-3">{user.email ?? "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-3">{user.email_verified_at ? new Date(user.email_verified_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{user.last_otp_sent_at ? new Date(user.last_otp_sent_at).toLocaleString() : "—"}</td>
                  <td className="p-3 text-xs text-gray-600 dark:text-gray-300">
                    {user.failed_otp_attempts ?? 0} failed / {user.verification_attempts ?? 0} total
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button onClick={() => runResend(user)} disabled={isBusy} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
                        Resend
                      </Button>
                      <Button onClick={() => runDeactivate(user)} disabled={isBusy} className="rounded border px-2 py-1 text-xs disabled:opacity-50">
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
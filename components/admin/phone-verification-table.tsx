"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { resendPhoneVerification, type AdminPhoneVerificationRow } from "@/lib/actions/phone-otp";
import { setAccountStatus } from "@/lib/actions/email-otp";

type FilterKey = "all" | "verified" | "pending" | "failed" | "blocked";

const STATUS_STYLES: Record<AdminPhoneVerificationRow["status"], string> = {
  verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  blocked: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

export function PhoneVerificationTable({ users }: { users: AdminPhoneVerificationRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = users.filter((user) => {
    if (filter !== "all" && user.status !== filter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const haystack = `${user.full_name ?? ""} ${user.username ?? ""} ${user.email ?? ""} ${user.phone_number ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const counts = users.reduce(
    (accumulator, user) => {
      accumulator[user.status] += 1;
      return accumulator;
    },
    { verified: 0, pending: 0, failed: 0, blocked: 0 } as Record<AdminPhoneVerificationRow["status"], number>,
  );

  const runResend = (user: AdminPhoneVerificationRow) => {
    if (!user.phone_number) return;
    setBusyId(user.id);
    startTransition(async () => {
      try {
        const result = await resendPhoneVerification(user.phone_number as string);
        if (result.ok) toast.success(result.message);
        else toast.error(result.error);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  const runDeactivate = (user: AdminPhoneVerificationRow) => {
    if (user.pending) return;
    setBusyId(user.id);
    startTransition(async () => {
      try {
        await setAccountStatus(user.id, user.is_active ? "suspended" : "active");
        toast.success(user.is_active ? "Suspended" : "Activated");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, or email"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 lg:max-w-xs dark:border-gray-700 dark:bg-gray-900"
        />
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "verified", "pending", "failed", "blocked"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${
                filter === item
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              {item}
              {item !== "all" ? ` (${counts[item]})` : ` (${users.length})`}
            </button>
          ))}
          <a
            href="/api/admin/phone-verification/export"
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">User</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Country</th>
              <th className="p-3">Status</th>
              <th className="p-3">Verified At</th>
              <th className="p-3">Last OTP</th>
              <th className="p-3">Attempts</th>
              <th className="p-3">Failed</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isBusy = pending && busyId === user.id;
              return (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="font-medium">{user.full_name || user.username || (user.pending ? "OTP pending" : "—")}</div>
                    {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                  </td>
                  <td className="p-3">{user.phone_number ?? "—"}</td>
                  <td className="p-3">{user.country_code ?? "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3">{user.phone_verified_at ? new Date(user.phone_verified_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{user.last_otp_sent_at ? new Date(user.last_otp_sent_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{user.otp_attempts}</td>
                  <td className="p-3">{user.failed_attempts}</td>
                  <td className="p-3">{user.verification_provider ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => runResend(user)}
                        disabled={isBusy || !user.phone_number}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => runDeactivate(user)}
                        disabled={isBusy || user.pending}
                        className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {user.blocked_until && new Date(user.blocked_until) > new Date() && (
                      <p className="mt-1 text-[10px] text-rose-500">
                        Blocked until {new Date(user.blocked_until).toLocaleTimeString()}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No phone verification records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

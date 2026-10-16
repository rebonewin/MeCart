"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resendPhoneVerification } from "@/lib/actions/phone-otp";
import { setAccountStatus } from "@/lib/actions/email-otp";

type Row = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone_number: string | null;
  country_code: string | null;
  phone_verified: boolean | null;
  phone_verified_at: string | null;
  last_otp_sent_at: string | null;
  otp_attempts: number | null;
  is_active: boolean | null;
  created_at: string;
};

export function PhoneVerificationTable({ users }: { users: Row[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = users.filter((user) => {
    const verified = Boolean(user.phone_verified);
    if (filter === "verified" && !verified) return false;
    if (filter === "pending" && verified) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const haystack = `${user.full_name ?? ""} ${user.username ?? ""} ${user.email ?? ""} ${user.phone_number ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const runResend = (user: Row) => {
    if (!user.phone_number) return;
    setBusyId(user.id);
    startTransition(async () => {
      try {
        const result = await resendPhoneVerification(user.phone_number as string);
        if (result.ok) toast.success("OTP sent");
        else toast.error(result.error);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed");
      } finally {
        setBusyId(null);
      }
    });
  };

  const runDeactivate = (user: Row) => {
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or email" className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 md:max-w-xs dark:border-gray-700 dark:bg-gray-900" />
        <div className="flex gap-2">
          {(["all", "verified", "pending"] as const).map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize ${filter === item ? "bg-indigo-600 text-white" : "border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"}`}>
              {item}
            </button>
          ))}
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
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const isBusy = pending && busyId === user.id;
              const verified = Boolean(user.phone_verified);
              return (
                <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="font-medium">{user.full_name || user.username || "—"}</div>
                    {user.email && <div className="text-xs text-gray-500">{user.email}</div>}
                  </td>
                  <td className="p-3">{user.phone_number ?? "—"}</td>
                  <td className="p-3">{user.country_code ?? "—"}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                      {verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="p-3">{user.phone_verified_at ? new Date(user.phone_verified_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{user.last_otp_sent_at ? new Date(user.last_otp_sent_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{user.otp_attempts ?? 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button onClick={() => runResend(user)} disabled={isBusy || !user.phone_number} className="rounded border px-2 py-1 text-xs disabled:opacity-50">Resend</button>
                      <button onClick={() => runDeactivate(user)} disabled={isBusy} className="rounded border px-2 py-1 text-xs disabled:opacity-50">{user.is_active ? "Deactivate" : "Activate"}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
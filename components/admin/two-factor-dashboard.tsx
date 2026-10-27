"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, KeyRound, Loader2, Lock, LockOpen, RotateCcw, Search, ShieldCheck, ShieldOff } from "lucide-react";

import { resetTwoFactorUser, unlockTwoFactorUser } from "@/lib/actions/two-factor";
import type { AdminTwoFactorData, AdminTwoFactorRow } from "@/lib/services/two-factor-service";
import { formatDateTime } from "@/lib/utils/date";

type Filter = "all" | "enabled" | "disabled" | "locked";

function formatDate(value: string | null): string {
  return formatDateTime(value);
}

export function TwoFactorDashboard({ data }: { data: AdminTwoFactorData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!query) return true;
      return [row.name, row.username, row.email, row.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [data.rows, filter, search]);

  const stats: Array<[string, number, React.ReactNode]> = [
    ["Total users", data.stats.totalUsers, <ShieldCheck key="a" className="h-4 w-4" />],
    ["With 2FA", data.stats.enabledUsers, <ShieldCheck key="b" className="h-4 w-4" />],
    ["Without 2FA", data.stats.withoutTwoFactor, <ShieldOff key="c" className="h-4 w-4" />],
    ["Recovery codes used", data.stats.recoveryCodesUsed, <KeyRound key="d" className="h-4 w-4" />],
    ["Failed attempts (24h)", data.stats.failedAttempts24h, <RotateCcw key="e" className="h-4 w-4" />],
    ["Locked users", data.stats.lockedUsers, <Lock key="f" className="h-4 w-4" />],
  ];

  const runAction = async (
    row: AdminTwoFactorRow,
    action: "unlock" | "reset",
  ) => {
    const confirmation =
      action === "unlock"
        ? `Clear the second-factor lock for ${row.email ?? row.username ?? "this user"}?`
        : `Reset two-factor authentication for ${row.email ?? row.username ?? "this user"}? They will need to enroll again.`;
    if (!window.confirm(confirmation)) return;

    setBusyId(row.userId);
    try {
      const result = action === "unlock" ? await unlockTwoFactorUser(row.userId) : await resetTwoFactorUser(row.userId);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value, icon]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="flex items-center gap-2 text-sm text-gray-500">
              {icon}
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <label className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, username, email or phone"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
            aria-label="Filter by 2FA status"
          >
            <option value="all">All users</option>
            <option value="enabled">2FA enabled</option>
            <option value="disabled">2FA disabled</option>
            <option value="locked">Locked</option>
          </select>
          <a
            href="/api/admin/security/two-factor/export"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">2FA</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Enabled on</th>
                <th className="px-5 py-3">Last used</th>
                <th className="px-5 py-3">Recovery</th>
                <th className="px-5 py-3">Failed</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                    No users match the current filters.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {row.name ?? row.username ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-gray-500">{row.email ?? row.phone ?? row.userId}</p>
                  </td>
                  <td className="px-5 py-3">
                    {row.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        <ShieldCheck className="h-3 w-3" /> On
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                        <ShieldOff className="h-3 w-3" /> Off
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 capitalize">{row.method ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(row.enabledAt)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{formatDate(row.lastUsedAt)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {row.recoveryRemaining} left / {row.recoveryUsed} used
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{row.failedAttempts}</td>
                  <td className="px-5 py-3">
                    {row.status === "locked" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    ) : row.status === "enabled" ? (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">Enabled</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500">Disabled</span>
                    )}
                    {row.lockedUntil && (
                      <p className="mt-1 text-[11px] text-gray-500">until {formatDate(row.lockedUntil)}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {row.status === "locked" && (
                        <Button
                          type="button"
                          onClick={() => void runAction(row, "unlock")}
                          disabled={busyId === row.userId}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          {busyId === row.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <LockOpen className="h-3 w-3" />
                          )}
                          Unlock
                        </Button>
                      )}
                      {row.enabled && (
                        <Button
                          type="button"
                          onClick={() => void runAction(row, "reset")}
                          disabled={busyId === row.userId}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                          {busyId === row.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Reset 2FA
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-gray-800">
          Showing {rows.length} of {data.rows.length} users. Admin actions are recorded in the audit log.
        </p>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCustomerAction } from "@/lib/actions/customers";
import type { CustomerWithStats } from "@/lib/repositories/customers";
import type { AppRole } from "@/types/database";

const ROLES: readonly AppRole[] = ["admin", "manager", "customer", "guest"];

const ROLE_BADGE: Record<AppRole, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  customer: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  guest: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
};

function formatMoney(value: number): string {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initial(customer: CustomerWithStats): string {
  const source = customer.fullName || customer.username || customer.email || "?";
  return source.trim().charAt(0).toUpperCase();
}

export function CustomersTable({
  customers,
  currentUserId,
}: {
  customers: CustomerWithStats[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => {
      if (roleFilter !== "all" && customer.role !== roleFilter) return false;
      if (statusFilter === "active" && !customer.isActive) return false;
      if (statusFilter === "inactive" && customer.isActive) return false;
      if (!q) return true;
      return [customer.fullName, customer.username, customer.email, customer.phone].some((value) =>
        value?.toLowerCase().includes(q),
      );
    });
  }, [customers, query, roleFilter, statusFilter]);

  const run = (customer: CustomerWithStats, input: { role?: string; isActive?: boolean }, message: string) => {
    setBusyId(customer.userId);
    startTransition(async () => {
      try {
        await updateCustomerAction(customer.userId, input);
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update customer");
      } finally {
        setBusyId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-gray-800 dark:bg-gray-900"
        />
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value as "all" | AppRole)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm capitalize dark:border-gray-800 dark:bg-gray-900"
        >
          <option value="all">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm capitalize dark:border-gray-800 dark:bg-gray-900"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length} of {customers.length} customers
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Customer</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Role</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Spent</th>
              <th className="p-3">Loyalty</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => {
              const isSelf = customer.userId === currentUserId;
              const isBusy = pending && busyId === customer.userId;
              return (
                <tr key={customer.userId} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {customer.avatarUrl ? (
                        <Image src={customer.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                          {initial(customer)}
                        </span>
                      )}
                      <div>
                        <p className="font-medium">
                          {customer.fullName ?? customer.username ?? "Customer"}
                          {isSelf && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                          {!customer.isActive && (
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-500/15 dark:text-gray-400">
                              Inactive
                            </span>
                          )}
                        </p>
                        {customer.username && <p className="text-xs text-gray-500">@{customer.username}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <p>{customer.email ?? "—"}</p>
                    {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                  </td>
                  <td className="p-3">
                    <select
                      value={customer.role}
                      onChange={(event) =>
                        run(
                          customer,
                          { role: event.target.value },
                          `${customer.fullName ?? customer.username ?? "Customer"} is now ${event.target.value}`,
                        )
                      }
                      disabled={isSelf || isBusy}
                      title={isSelf ? "You cannot change your own role" : undefined}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_BADGE[customer.role]}`}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">{customer.totalOrders.toLocaleString("en-US")}</td>
                  <td className="p-3">{formatMoney(customer.totalSpent)}</td>
                  <td className="p-3">{customer.loyaltyPoints.toLocaleString("en-US")}</td>
                  <td className="p-3">{formatDate(customer.createdAt)}</td>
                  <td className="p-3">{formatDate(customer.lastLoginAt)}</td>
                  <td className="p-3">
                    <Button
                      onClick={() =>
                        run(
                          customer,
                          { isActive: !customer.isActive },
                          customer.isActive
                            ? `${customer.fullName ?? customer.username ?? "Customer"} deactivated`
                            : `${customer.fullName ?? customer.username ?? "Customer"} activated`,
                        )
                      }
                      disabled={isSelf || isBusy}
                      title={isSelf ? "You cannot deactivate your own account" : undefined}
                      className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {customer.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  No customers match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

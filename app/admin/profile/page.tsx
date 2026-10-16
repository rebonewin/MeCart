import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  manager: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  customer: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  guest: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400",
};

export default async function AdminProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const displayName = user.name ?? user.username ?? user.email ?? "Admin";
  const initial = displayName.trim().charAt(0).toUpperCase();

  const rows = [
    { label: "Full Name", value: user.name ?? "—" },
    { label: "Email", value: user.email ?? "—" },
    { label: "Username", value: user.username ? `@${user.username}` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-gray-500">Your admin account details.</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {initial}
            </span>
          )}
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_BADGE[user.role] ?? ROLE_BADGE.guest}`}
            >
              {user.role}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{row.label}</dt>
              <dd className="mt-1 text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/admin/settings"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          Store Settings
        </Link>
        <Link
          href="/admin/theme"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          Theme Customizer
        </Link>
        <Link
          href="/admin/security"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          Security Overview
        </Link>
      </section>
    </div>
  );
}

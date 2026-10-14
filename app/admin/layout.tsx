export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 flex-shrink-0 rounded-2xl bg-white p-4 shadow-sm md:block">
          <h2 className="mb-4 text-lg font-bold text-indigo-600">MeCart Admin</h2>
          <nav className="space-y-1 text-sm">
            {[
              "dashboard",
              "products",
              "categories",
              "brands",
              "orders",
              "payments",
              "customers",
              "users",
              "inventory",
              "coupons",
              "reports",
              "analytics",
              "reviews",
              "security",
              "audit-logs",
              "settings",
              "profile",
            ].map((item) => (
              <a
                key={item}
                href={`/admin/${item === "dashboard" ? "" : item}`}
                className="block rounded-md px-3 py-2 capitalize hover:bg-indigo-50 hover:text-indigo-600"
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>
        <section className="flex-1">{children}</section>
      </div>
    </div>
  );
}

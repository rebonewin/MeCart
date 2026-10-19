import { auth } from "@/lib/auth";
import { getAdminTwoFactorData } from "@/lib/services/two-factor-service";
import { TwoFactorDashboard } from "@/components/admin/two-factor-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminTwoFactorPage() {
  await auth();
  const data = await getAdminTwoFactorData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">2FA Dashboard</h1>
        <p className="text-sm text-gray-500">
          Two-factor adoption, recovery-code usage, failed attempts and locked accounts.
        </p>
      </div>
      <TwoFactorDashboard data={data} />
    </div>
  );
}

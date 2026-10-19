import { redirect } from "next/navigation";

import { SecuritySettings } from "@/components/security/security-settings";
import { getCurrentUser } from "@/lib/auth";
import { getTwoFactorStatus } from "@/lib/services/two-factor-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Security — MeCart",
  description: "Manage two-factor authentication and trusted devices.",
};

export default async function SecuritySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const status = await getTwoFactorStatus();

  return <SecuritySettings status={status} />;
}

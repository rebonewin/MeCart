import { redirect } from "next/navigation";

import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge";
import { getTwoFactorChallengeView } from "@/lib/services/two-factor-service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Two-factor verification — MeCart",
  description: "Confirm your identity to finish signing in.",
};

export default async function TwoFactorPage() {
  const view = await getTwoFactorChallengeView();
  if (!view) redirect("/login");

  return <TwoFactorChallenge view={view} />;
}

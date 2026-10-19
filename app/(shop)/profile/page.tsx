import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listAddresses } from "@/lib/repositories/addresses";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/account/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [addresses, profileResult] = await Promise.all([
    listAddresses(user.id),
    supabase
      .from("profiles")
      .select("phone_number, country_code, phone_verified, phone_verified_at, verification_provider, blocked_until")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const phone = profileResult.data;

  return (
    <ProfileClient
      initialUser={{ name: user.name, email: user.email, username: user.username, role: user.role }}
      initialPhone={{
        number: phone?.phone_number ?? null,
        countryCode: phone?.country_code ?? null,
        verified: Boolean(phone?.phone_verified),
        verifiedAt: phone?.phone_verified_at ?? null,
        provider: phone?.verification_provider ?? null,
        blockedUntil: phone?.blocked_until ?? null,
      }}
      initialAddresses={addresses.map((address) => ({
        id: address.id,
        label: address.label,
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        isDefault: address.is_default,
      }))}
    />
  );
}

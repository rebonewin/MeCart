import { getCurrentUser } from "@/lib/auth";
import { listAddresses } from "@/lib/repositories/addresses";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/account/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addresses = await listAddresses(user.id);

  return (
    <ProfileClient
      initialUser={{ name: user.name, email: user.email, username: user.username, role: user.role }}
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

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/account/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!user) redirect("/login");

  return (
    <ProfileClient
      initialUser={{ name: user.name, email: user.email, username: user.username, role: user.role }}
      initialAddresses={addresses as unknown as Parameters<typeof ProfileClient>[0]["initialAddresses"]}
    />
  );
}

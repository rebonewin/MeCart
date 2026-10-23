import { auth } from "@/lib/auth";
import { listUserOrders } from "@/lib/actions/orders";
import { RewardsClient } from "@/components/account/rewards-client";
import type { LoyaltyOrderFact } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const session = await auth();
  const orders = session?.user?.id ? await listUserOrders(session.user.id) : [];
  const facts: LoyaltyOrderFact[] = orders.map((order) => ({
    id: order.id,
    total: order.grandTotal,
    createdAt: order.createdAt,
    status: order.status,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  return (
    <RewardsClient
      user={session?.user ? { name: session.user.name, email: session.user.email } : null}
      orders={facts}
    />
  );
}

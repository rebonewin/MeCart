import { requireSellerContext } from "@/lib/marketplace/context";
import { getSellerFinance } from "@/lib/repositories/seller";
import { SellerFinanceView } from "@/components/seller/finance-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts | MeCart Seller" };

export default async function SellerPayoutsPage() {
  const context = await requireSellerContext();
  const finance = await getSellerFinance(context.vendor.id);
  return <SellerFinanceView finance={finance} commission={context.vendor.commission_rate} focus="payouts" />;
}

import { HomePageClient } from "@/components/storefront/home-client";
import { getStorefrontHomeData } from "@/lib/services/storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getStorefrontHomeData();
  return <HomePageClient data={data} />;
}

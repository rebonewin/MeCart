import type { CSSProperties } from "react";
import { ShopNavbar } from "@/components/shop/shop-navbar";
import { SiteFooter } from "@/components/shop/site-footer";
import { CompareBar } from "@/components/shop/compare-bar";
import { WelcomeToast } from "@/components/shop/welcome-toast";
import { getActiveTheme } from "@/lib/repositories/theme";
import { varsForTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const theme = await getActiveTheme();
  const themeVars = varsForTheme(theme) as CSSProperties;

  return (
    <div className="flex min-h-screen flex-col" style={themeVars}>
      <WelcomeToast />
      <ShopNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CompareBar />
    </div>
  );
}

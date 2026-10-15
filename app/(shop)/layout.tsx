import Link from "next/link";
import { ShopNavbar } from "@/components/shop/shop-navbar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <ShopNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200/80 bg-white/80 px-4 py-10 text-sm text-gray-500 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">MeCart</p>
            <p className="mt-3">Premium shopping experience with trusted products and secure checkout.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Shop</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/products">All Products</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/search">Search</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Support</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/contact">Contact</Link>
              <Link href="/about">About</Link>
              <Link href="/login">Account</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Policies</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-gray-200/70 pt-5 text-center dark:border-gray-800">
          © 2026 MeCart. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

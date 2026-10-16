import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
    "/verify-email/:path*",
  ],
};

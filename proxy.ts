import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedUserRoutes = ["/checkout", "/orders", "/profile", "/wishlist"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken =
    request.cookies.get("mecart.session-token")?.value ??
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (pathname.startsWith("/admin")) {
    if (!sessionToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (protectedUserRoutes.some((route) => pathname.startsWith(route))) {
    if (!sessionToken) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/orders/:path*", "/profile/:path*", "/wishlist/:path*"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/app/lib/session";

const PROTECTED_PREFIXES = ["/dashboard", "/invoices"];
const AUTH_ROUTES = ["/login"];

// Optimistic auth check — only reads the session cookie (no DB hit), so it
// stays cheap on every request. Real authorization still happens in the DAL
// (app/lib/dal.ts) close to the data.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  const token = request.cookies.get("session")?.value;
  const session = await decrypt(token);

  if (isProtectedRoute && !session?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

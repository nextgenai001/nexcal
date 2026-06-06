import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * NexCal v3.0 — Route protection middleware (edge-compatible).
 * Uses getToken() from next-auth/jwt to read the JWT without
 * importing Prisma or bcryptjs (which are Node.js-only).
 *
 * Routing rules:
 *   /admin/*  → PLATFORM_ADMIN only
 *   /user/*   → Any authenticated user (TENANT or PLATFORM_ADMIN redirected out)
 *   /login    → Redirect already-authenticated users to their dashboard
 *   Other     → Public (no check)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the JWT from the session cookie (edge-safe, no crypto issues)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // ── /admin/* routes ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!token) {
      // Not authenticated → redirect to login with callbackUrl
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== "PLATFORM_ADMIN") {
      // Authenticated but wrong role → send to tenant dashboard
      return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── /user/* routes ───────────────────────────────────────────────────────
  if (pathname.startsWith("/user")) {
    if (!token) {
      // Not authenticated → redirect to login with callbackUrl
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role === "PLATFORM_ADMIN") {
      // Admin trying to access tenant routes → redirect to admin dashboard
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── /login page ──────────────────────────────────────────────────────────
  if (pathname === "/login" && token) {
    // Already logged in → redirect to their appropriate dashboard
    if (token.role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  // All other routes are public
  return NextResponse.next();
}

export const config = {
  // Only run middleware on protected/auth routes — skip static files, API, etc.
  matcher: ["/admin/:path*", "/user/:path*", "/login"],
};

// src/lib/rbac.ts
// NexCal v3.0 — Role-based access control helpers

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export type UserRole = "PLATFORM_ADMIN" | "TENANT";

export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string | null | undefined;
  email: string | null | undefined;
  role: UserRole;
  businessName: string | null;
  timezone: string;
  isActive: boolean;
}

/**
 * Get the current authenticated user's session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    businessName: session.user.businessName,
    timezone: session.user.timezone,
    isActive: session.user.isActive,
  };
}

/**
 * Require PLATFORM_ADMIN role. Redirects to /login if not authenticated,
 * or to /user/dashboard if authenticated but wrong role.
 * Use at the top of admin page/layout server components.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PLATFORM_ADMIN") redirect("/user/dashboard");
  return user;
}

/**
 * Require TENANT role. Redirects to /login if not authenticated,
 * or to /admin/dashboard if authenticated as PLATFORM_ADMIN.
 * Use at the top of tenant page/layout server components.
 */
export async function requireTenant(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PLATFORM_ADMIN") redirect("/admin/dashboard");
  return user;
}

/**
 * Require any authenticated user (any role).
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

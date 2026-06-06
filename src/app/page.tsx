import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * NexCal v3.0 — Root page.
 * Server component that redirects all visitors based on auth state:
 *   PLATFORM_ADMIN → /admin/dashboard
 *   TENANT         → /user/dashboard
 *   Unauthenticated → /login
 */
export default async function RootPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.role === "PLATFORM_ADMIN") {
      redirect("/admin/dashboard");
    }
    redirect("/user/dashboard");
  }

  redirect("/login");
}

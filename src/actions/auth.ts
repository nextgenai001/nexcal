"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslator } from "@/lib/i18n/server";

/**
 * NexCal v3.0 — Login server action.
 * Signs in the user via Credentials provider and redirects based on role:
 *   PLATFORM_ADMIN → /admin/dashboard
 *   TENANT         → /user/dashboard
 *
 * Note: signIn() with redirect:false does NOT call redirect() internally,
 * so we read the fresh session afterwards and call redirect() ourselves.
 * redirect() throws a NEXT_REDIRECT error which must be re-thrown.
 */
export async function loginAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    // Sign in without a hard-coded destination — we'll determine the
    // redirect target based on the user's role after auth succeeds.
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    // After successful sign-in the cookie is set; read the session.
    const session = await auth();
    const role = session?.user?.role;

    // Redirect to the role-appropriate dashboard.
    // redirect() throws internally — we must NOT catch it.
    if (role === "PLATFORM_ADMIN") {
      redirect("/admin/dashboard");
    }
    redirect("/user/dashboard");
  } catch (error) {
    // NEXT_REDIRECT is not a real error — re-throw it so Next.js can handle it.
    if (error instanceof Error && (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    if (error instanceof AuthError) {
      const { t } = await getTranslator();
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: t("auth.invalidCredentials"),
            success: false,
          };
        default:
          return {
            error: t("auth.errorSystem"),
            success: false,
          };
      }
    }

    // Unexpected error — bubble up
    throw error;
  }
}

/**
 * Signs the current user out and redirects to /login.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

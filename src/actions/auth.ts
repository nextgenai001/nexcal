"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getTranslator } from "@/lib/i18n/server";

export async function loginAction(
  _prevState: { error: string | null; success: boolean },
  formData: FormData
): Promise<{ error: string | null; success: boolean }> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/admin/dashboard",
    });

    return { error: null, success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const { t } = await getTranslator();
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: t("auth.errorIncorrect"),
            success: false,
          };
        default:
          return {
            error: t("auth.errorSystem"),
            success: false,
          };
      }
    }
    // NEXT_REDIRECT throws an error that we need to re-throw
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

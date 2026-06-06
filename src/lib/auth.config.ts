import type { NextAuthConfig } from "next-auth";

/**
 * NexCal v3.0 — Auth.js configuration (EDGE-COMPATIBLE).
 * This file MUST NOT import Node.js modules (bcryptjs, prisma, etc.).
 * It is used by the full auth.ts and optionally by the middleware.
 *
 * Route protection is handled in middleware.ts via getToken().
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    /**
     * Persist extra fields from the User object into the JWT on first sign-in.
     * On subsequent requests only the token is available (user is undefined).
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.username = user.username ?? "";
        token.role = user.role ?? "TENANT";
        token.businessName = user.businessName ?? null;
        token.timezone = user.timezone ?? "UTC";
        token.isActive = user.isActive ?? true;
      }
      return token;
    },

    /**
     * Expose JWT fields on the session object so client/server components
     * can access them via useSession() or auth().
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "PLATFORM_ADMIN" | "TENANT";
        session.user.businessName = (token.businessName as string | null) ?? null;
        session.user.timezone = (token.timezone as string) ?? "UTC";
        session.user.isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },
  },
  providers: [], // Providers are added in auth.ts (full Node.js runtime)
};

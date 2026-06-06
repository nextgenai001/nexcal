import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

/**
 * NexCal v3.0 — Full Auth.js configuration (Node.js runtime only).
 * Adds the Credentials provider with bcrypt password verification.
 * authConfig (edge-safe) is used as the base configuration.
 *
 * Used by: Server Actions, API routes, and server components via auth().
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate that both fields are present
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Look up user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        // Reject deactivated accounts — inactive tenants cannot sign in
        if (!user.isActive) {
          return null;
        }

        // Verify the bcrypt password hash
        const isPasswordValid = await compare(password, user.hashedPassword);

        if (!isPasswordValid) {
          return null;
        }

        // Return the user shape — these fields are persisted into the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          role: user.role,
          businessName: user.businessName,
          timezone: user.timezone,
          isActive: user.isActive,
        };
      },
    }),
  ],
});

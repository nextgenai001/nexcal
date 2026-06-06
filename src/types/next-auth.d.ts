import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "PLATFORM_ADMIN" | "TENANT";
      businessName: string | null;
      timezone: string;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: "PLATFORM_ADMIN" | "TENANT";
    businessName: string | null;
    timezone: string;
    isActive: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: "PLATFORM_ADMIN" | "TENANT";
    businessName: string | null;
    timezone: string;
    isActive: boolean;
  }
}

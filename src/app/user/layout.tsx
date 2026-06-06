// src/app/user/layout.tsx
// NexCal v3.0 — Tenant panel layout

import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import UserSidebar from "@/components/user/UserSidebar";
import UserHeader from "@/components/user/UserHeader";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireTenant();
  
  // Fetch fresh user data from DB to avoid stale session data (e.g. business name changes)
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      username: true,
      businessName: true,
    },
  });

  const user = dbUser ? { ...sessionUser, ...dbUser } : sessionUser;

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <UserSidebar username={user.username} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <UserHeader user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

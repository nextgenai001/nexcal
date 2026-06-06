// src/app/user/layout.tsx
// NexCal v3.0 — Tenant panel layout

import { requireTenant } from "@/lib/rbac";
import UserSidebar from "@/components/user/UserSidebar";
import UserHeader from "@/components/user/UserHeader";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireTenant();

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

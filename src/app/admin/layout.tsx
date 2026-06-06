import type { Metadata } from "next";
import { requireAdmin } from "@/lib/rbac";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "NexCal";

export const metadata: Metadata = {
  title: {
    default: `Dashboard — ${appName} Admin`,
    template: `%s — ${appName} Admin`,
  },
  description: `${appName} platform administration panel`,
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role-gate: redirects to /login or /unauthorized if not PLATFORM_ADMIN
  const user = await requireAdmin();

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <AdminHeader user={user} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

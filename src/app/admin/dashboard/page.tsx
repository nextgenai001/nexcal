import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { format } from "date-fns";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// ── Action color map ────────────────────────────────────────────────────────

function actionBadge(action: string): string {
  if (action.includes("CREATED")) return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30";
  if (action.includes("DEACTIVATED") || action.includes("DELETED")) return "bg-red-500/15 text-red-400 ring-red-500/30";
  if (action.includes("CANCELLED")) return "bg-amber-500/15 text-amber-400 ring-amber-500/30";
  if (action.includes("REACTIVATED") || action.includes("UPDATED")) return "bg-blue-500/15 text-blue-400 ring-blue-500/30";
  return "bg-slate-500/15 text-slate-400 ring-slate-500/30";
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentClass,
  alert,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-slate-900 p-5 ${
        alert ? "border-red-500/40" : "border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${alert ? "text-red-400" : "text-white"}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
      </div>
      {/* Decorative glow */}
      <div
        className={`pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-20 ${accentClass}`}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  await requireAdmin();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalTenants,
    activeTenants,
    totalBookings,
    recentBookings,
    webhookFailures,
    recentAuditLogs,
    totalEmbedViews,
    successfulWebhooks,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.user.count({ where: { role: "TENANT", isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.webhookDelivery.count({ where: { status: "FAILED" } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, username: true } },
        target: { select: { name: true, username: true } },
      },
    }),
    prisma.user.aggregate({
      where: { role: "TENANT" },
      _sum: {
        embedViews: true,
      },
    }),
    prisma.webhookDelivery.count({ where: { status: "SUCCESS" } }),
  ]);

  const inactiveTenants = totalTenants - activeTenants;
  const embedTraffic = totalEmbedViews._sum.embedViews ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor all tenants, bookings, and system health at a glance.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Tenants"
          value={totalTenants}
          subtitle={`${activeTenants} active · ${inactiveTenants} inactive`}
          accentClass="bg-indigo-500/20 text-indigo-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
        />

        <StatCard
          title="Total Bookings"
          value={totalBookings}
          subtitle="Across all tenants"
          accentClass="bg-violet-500/20 text-violet-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />

        <StatCard
          title="Bookings Today"
          value={recentBookings}
          subtitle="New bookings since midnight"
          accentClass="bg-emerald-500/20 text-emerald-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />

        <StatCard
          title="Embed Traffic"
          value={embedTraffic}
          subtitle="Total embedded views"
          accentClass="bg-sky-500/20 text-sky-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          }
        />

        <StatCard
          title="Webhooks Sent"
          value={successfulWebhooks}
          subtitle="Successful deliveries"
          accentClass="bg-teal-500/20 text-teal-400"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          }
        />

        <Link href="/admin/errors?component=API" className="block transition-all hover:scale-[1.01]">
          <StatCard
            title="Webhook Failures"
            value={webhookFailures}
            subtitle={webhookFailures > 0 ? "Requires attention" : "All deliveries healthy"}
            accentClass={webhookFailures > 0 ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-400"}
            alert={webhookFailures > 0}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            }
          />
        </Link>
      </div>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/users"
          className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-indigo-500/40 hover:bg-slate-800/60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 transition-colors group-hover:bg-indigo-500/25">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Manage Tenants</p>
            <p className="text-sm text-slate-400">Create or edit tenant accounts</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-slate-600 transition-colors group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          href="/admin/logs"
          className="group flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-violet-500/40 hover:bg-slate-800/60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 transition-colors group-hover:bg-violet-500/25">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Audit Logs</p>
            <p className="text-sm text-slate-400">View all platform activity</p>
          </div>
          <svg className="ml-auto h-4 w-4 text-slate-600 transition-colors group-hover:text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
          <Link
            href="/admin/logs"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            View all →
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-500">No audit logs yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                {/* Action badge */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${actionBadge(log.action)}`}
                >
                  {log.action}
                </span>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-300">
                    {log.actor ? (
                      <span className="font-medium text-white">{log.actor.name ?? log.actor.username}</span>
                    ) : (
                      <span className="text-slate-500">System</span>
                    )}
                    {log.target && (
                      <>
                        {" → "}
                        <span className="text-slate-400">{log.target.name ?? log.target.username}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Timestamp */}
                <time className="shrink-0 text-xs text-slate-600">
                  {format(new Date(log.createdAt), "MMM d, HH:mm")}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

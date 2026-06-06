import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import EditTenantClient from "./EditTenantClient";

export const metadata: Metadata = { title: "Edit Tenant" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTenantPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookings: true,
          eventTypes: true,
        },
      },
    },
  });

  if (!user || user.role !== "TENANT") {
    notFound();
  }

  // Get last booking date
  const lastBooking = await prisma.booking.findFirst({
    where: { userId: id },
    orderBy: { startTime: "desc" },
    select: { startTime: true },
  });

  // Get user's error logs (up to 100 most recent)
  const errorLogs = await prisma.errorLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tenantData = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    businessName: user.businessName,
    timezone: user.timezone,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    bookingCount: user._count.bookings,
    eventTypeCount: user._count.eventTypes,
    lastBookingAt: lastBooking?.startTime.toISOString() ?? null,
    embedViews: user.embedViews,
    errorLogs: errorLogs.map(log => ({
      id: log.id,
      message: log.message,
      stack: log.stack,
      path: log.path,
      component: log.component,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    })),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                user.isActive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-slate-400">@{user.username}</p>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{user._count.bookings}</p>
          <p className="mt-1 text-xs text-slate-500">Bookings</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{user._count.eventTypes}</p>
          <p className="mt-1 text-xs text-slate-500">Event Types</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-sm font-semibold text-white">
            {lastBooking
              ? format(new Date(lastBooking.startTime), "MMM d")
              : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Last Booking</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
          <p className="text-2xl font-bold text-white">{user.embedViews}</p>
          <p className="mt-1 text-xs text-slate-500">Embed Views</p>
        </div>
      </div>

      {/* ── Client form sections ─────────────────────────────────────────── */}
      <EditTenantClient tenant={tenantData} />
    </div>
  );
}

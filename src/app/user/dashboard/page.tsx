import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";

export const metadata = {
  title: "Dashboard - NexCal",
};

export default async function DashboardPage() {
  const user = await requireTenant();

  const [eventTypesCount, bookingsCount, todayBookings] = await Promise.all([
    prisma.eventType.count({
      where: { userId: user.id },
    }),
    prisma.booking.count({
      where: { userId: user.id },
    }),
    prisma.booking.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: {
        eventType: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-medium text-slate-400">Event Types</h2>
          <p className="mt-2 text-3xl font-bold">{eventTypesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-medium text-slate-400">Total Bookings</h2>
          <p className="mt-2 text-3xl font-bold">{bookingsCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-sm font-medium text-slate-400">Timezone</h2>
          <p className="mt-2 text-3xl font-bold">{user.timezone}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="font-semibold">Today's Schedule</h2>
          <Link
            href="/user/bookings"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            View all bookings
          </Link>
        </div>
        <div className="p-6">
          {todayBookings.length === 0 ? (
            <p className="text-sm text-slate-400">No bookings for today.</p>
          ) : (
            <div className="space-y-4">
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-4"
                >
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-slate-400">
                      {booking.eventType.name}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{format(booking.startTime, "h:mm a")}</p>
                    <p className="text-slate-400">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

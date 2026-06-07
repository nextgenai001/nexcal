import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import BookingFilterTabs from "./BookingFilterTabs";

export const metadata = {
  title: "Bookings - NexCal",
};

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string, q?: string, tab?: string }> }) {
  const user = await requireTenant();
  const resolvedParams = await searchParams;
  
  const currentTab = resolvedParams.tab || "upcoming";
  const status = resolvedParams.status || "ALL";
  const q = resolvedParams.q || "";

  const where: any = { userId: user.id };
  const now = new Date();
  
  // Apply tab filters
  if (currentTab === "upcoming") {
    where.startTime = { gte: now };
    where.status = { not: BookingStatus.CANCELLED };
  } else if (currentTab === "unconfirmed") {
    where.status = BookingStatus.PENDING;
  } else if (currentTab === "past") {
    where.startTime = { lt: now };
    where.status = { not: BookingStatus.CANCELLED };
  } else if (currentTab === "canceled") {
    where.status = BookingStatus.CANCELLED;
  }

  // Apply traditional filter overrides if specified
  if (status !== "ALL") {
    where.status = status;
  }
  
  if (q) {
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { eventType: true },
    orderBy: { startTime: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-sm text-slate-400">See upcoming and past events booked through your event type links.</p>
        </div>
        <Link
          href="/user/bookings/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          Add Booking
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <BookingFilterTabs currentTab={currentTab} q={q} status={status} />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                      </div>
                      <div className="text-base font-semibold text-slate-200">
                        {currentTab === "upcoming" ? "No upcoming bookings" : "No bookings found"}
                      </div>
                      <p className="max-w-xs text-xs text-slate-500">
                        {currentTab === "upcoming" 
                          ? "You have no upcoming bookings. As soon as someone books a time with you it will show up here."
                          : "Try adjusting your filters or search query to find what you are looking for."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{booking.customerName}</div>
                      <div className="text-xs">{booking.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">{booking.eventType.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-white">{format(booking.startTime, "MMM d, yyyy")}</div>
                      <div className="text-xs">{format(booking.startTime, "h:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
                        ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : ''}
                        ${booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : ''}
                        ${booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                        ${booking.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                        ${booking.status === 'NO_SHOW' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : ''}
                      `}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/user/bookings/${booking.id}`}
                        className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";

export const metadata = {
  title: "Bookings - NexCal",
};

export default async function BookingsPage({ searchParams }: { searchParams: { status?: string, q?: string } }) {
  const user = await requireTenant();
  
  const status = searchParams.status || "ALL";
  const q = searchParams.q || "";

  const where: any = { userId: user.id };
  
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
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-slate-400">Manage your appointments</p>
        </div>
        <Link
          href="/user/bookings/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add Booking
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-1 items-center gap-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name or email..."
              className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Filter
            </button>
            {(q || status !== "ALL") && (
              <Link href="/user/bookings" className="text-sm text-slate-400 hover:text-white">
                Clear
              </Link>
            )}
          </form>
        </div>

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
                  <td colSpan={5} className="px-6 py-8 text-center">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{booking.customerName}</div>
                      <div className="text-xs">{booking.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4">{booking.eventType.name}</td>
                    <td className="px-6 py-4">
                      <div>{format(booking.startTime, "MMM d, yyyy")}</div>
                      <div className="text-xs">{format(booking.startTime, "h:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
                        ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' : ''}
                        ${booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                        ${booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : ''}
                        ${booking.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' : ''}
                        ${booking.status === 'NO_SHOW' ? 'bg-slate-500/10 text-slate-400' : ''}
                      `}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/user/bookings/${booking.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
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

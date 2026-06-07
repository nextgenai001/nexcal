import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import BookingActions from "./BookingActions";
import Link from "next/link";

export const metadata = {
  title: "Booking Details - NexCal",
};

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenant();
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id, userId: user.id },
    include: { eventType: true },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <p className="text-sm text-slate-400">View and manage appointment</p>
        </div>
        <Link
          href="/user/bookings"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to Bookings
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">{booking.eventType.name}</h2>
                <p className="text-slate-400">{booking.eventType.duration} minutes</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
                ${booking.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-400' : ''}
                ${booking.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                ${booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : ''}
                ${booking.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' : ''}
                ${booking.status === 'NO_SHOW' ? 'bg-slate-500/10 text-slate-400' : ''}
              `}>
                {booking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{formatInTimeZone(booking.startTime, user.timezone, "EEEE, MMMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-slate-500">Time ({user.timezone})</p>
                <p className="font-medium">{formatInTimeZone(booking.startTime, user.timezone, "h:mm a")} - {formatInTimeZone(booking.endTime, user.timezone, "h:mm a")}</p>
              </div>
              <div>
                <p className="text-slate-500">Customer Name</p>
                <p className="font-medium">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Customer Email</p>
                <p className="font-medium">{booking.customerEmail || "N/A"}</p>
              </div>
              {booking.customerPhone && (
                <div>
                  <p className="text-slate-500">Customer Phone</p>
                  <p className="font-medium">{booking.customerPhone}</p>
                </div>
              )}
            </div>

            {booking.status === 'CANCELLED' && booking.cancelReason && (
              <div className="mt-6 rounded-lg bg-red-500/10 p-4 border border-red-500/20">
                <p className="text-sm font-medium text-red-400 mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-200">{booking.cancelReason}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
             <h2 className="text-lg font-semibold mb-4">Custom Fields</h2>
             {Object.keys(booking.customFieldData || {}).length > 0 ? (
               <div className="space-y-4">
                 {Object.entries(booking.customFieldData as Record<string, string>).map(([key, value]) => (
                   <div key={key}>
                     <p className="text-sm text-slate-500">{key}</p>
                     <p className="text-sm font-medium">{value}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-slate-500">No custom fields provided.</p>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <BookingActions booking={booking} />
        </div>
      </div>
    </div>
  );
}

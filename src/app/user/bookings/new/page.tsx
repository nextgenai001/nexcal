import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import BookingForm from "./BookingForm";

export const metadata = {
  title: "Add Booking - NexCal",
};

export default async function NewBookingPage() {
  const user = await requireTenant();

  const eventTypes = await prisma.eventType.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Booking</h1>
        <p className="text-sm text-slate-400">Manually enter a new booking</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <BookingForm eventTypes={eventTypes} />
      </div>
    </div>
  );
}

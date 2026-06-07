import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import EventTypeForm from "../EventTypeForm";

export const metadata = {
  title: "New Event Type - NexCal",
};

export default async function NewEventTypePage() {
  const user = await requireTenant();

  const availabilitySchedules = await prisma.availabilitySchedule.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Event Type</h1>
        <p className="text-sm text-slate-400">Create a new bookable event</p>
      </div>
      
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <EventTypeForm availabilitySchedules={availabilitySchedules} />
      </div>
    </div>
  );
}

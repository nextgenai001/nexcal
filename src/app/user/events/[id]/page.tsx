import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import EventTypeForm from "../EventTypeForm";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Event Type - NexCal",
};

export default async function EditEventTypePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenant();
  const { id } = await params;
  
  const [eventType, availabilitySchedules] = await Promise.all([
    prisma.eventType.findFirst({
      where: { id, userId: user.id },
      include: { webhookEndpoints: true },
    }),
    prisma.availabilitySchedule.findMany({
      where: { userId: user.id },
      include: { schedules: true },
      orderBy: { createdAt: "asc" }
    })
  ]);
  
  if (!eventType) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-none w-full px-2 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Event Type</h1>
        <p className="text-sm text-slate-400">Update your bookable event</p>
      </div>
      
      <EventTypeForm eventType={eventType} availabilitySchedules={availabilitySchedules} />
    </div>
  );
}

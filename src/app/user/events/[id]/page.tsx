import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import EventTypeForm from "../EventTypeForm";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Event Type - NexCal",
};

export default async function EditEventTypePage({ params }: { params: { id: string } }) {
  const user = await requireTenant();
  
  const eventType = await prisma.eventType.findUnique({
    where: { id: params.id, userId: user.id },
  });
  
  if (!eventType) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Event Type</h1>
        <p className="text-sm text-slate-400">Update your bookable event</p>
      </div>
      
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <EventTypeForm eventType={eventType} />
      </div>
    </div>
  );
}

import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EventTypeCard from "./EventTypeCard";

export const metadata = {
  title: "Event Types - NexCal",
};

export default async function EventTypesPage() {
  const user = await requireTenant();

  const eventTypes = await prisma.eventType.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Types</h1>
          <p className="text-sm text-slate-400">Manage your bookable events</p>
        </div>
        <Link
          href="/user/events/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New Event Type
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">No event types found.</p>
          <Link
            href="/user/events/new"
            className="mt-4 inline-block text-indigo-400 hover:text-indigo-300"
          >
            Create your first event type
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((et) => (
            <EventTypeCard key={et.id} eventType={et} username={user.username} />
          ))}
        </div>
      )}
    </div>
  );
}

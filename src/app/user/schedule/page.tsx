import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import ScheduleForm from "./ScheduleForm";
import DateOverridesForm from "./DateOverridesForm";

export const metadata = {
  title: "Availability - NexCal",
};

export default async function SchedulePage() {
  const user = await requireTenant();

  const [schedules, dateOverrides] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId: user.id },
      orderBy: { dayOfWeek: "asc" },
    }),
    prisma.dateOverride.findMany({
      where: { userId: user.id, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    })
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="text-sm text-slate-400">Set your weekly hours and date overrides in {user.timezone}</p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Weekly Hours</h2>
            <ScheduleForm schedules={schedules} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold mb-4">Date Overrides</h2>
            <p className="text-sm text-slate-400 mb-6">Add specific dates where your availability differs from your weekly hours.</p>
            <DateOverridesForm overrides={dateOverrides} />
          </div>
        </div>
      </div>
    </div>
  );
}

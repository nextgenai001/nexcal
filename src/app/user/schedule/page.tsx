import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import ScheduleForm from "./ScheduleForm";

export const metadata = {
  title: "Availability - NexCal",
};

export default async function SchedulePage() {
  const user = await requireTenant();

  const [availabilitySchedules, dateOverrides, dbUser] = await Promise.all([
    prisma.availabilitySchedule.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: {
        schedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        }
      }
    }),
    prisma.dateOverride.findMany({
      where: { userId: user.id, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { globalBreaks: true }
    })
  ]);

  const globalBreaks = Array.isArray(dbUser?.globalBreaks) ? dbUser.globalBreaks : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Availability</h1>
        <p className="text-sm text-slate-400">Configure your scheduling availability, breaks, and date overrides in {user.timezone}</p>
      </div>
      
      <ScheduleForm 
        availabilitySchedules={availabilitySchedules} 
        globalBreaks={globalBreaks} 
        dateOverrides={dateOverrides} 
      />
    </div>
  );
}

import { formatInTimeZone, toDate } from "date-fns-tz";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export interface ConvertedSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Converts weekly availability schedule slot from old timezone to new timezone.
 * Splits slots crossing midnight into two slots.
 */
export function convertWeeklySchedule(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  oldTz: string,
  newTz: string
): ConvertedSchedule[] {
  // Base day mapping (Jan 4, 2026 is Sunday (dayOfWeek = 0))
  const baseDates = [
    "2026-01-04", // Sun
    "2026-01-05", // Mon
    "2026-01-06", // Tue
    "2026-01-07", // Wed
    "2026-01-08", // Thu
    "2026-01-09", // Fri
    "2026-01-10", // Sat
  ];

  const baseDateStr = baseDates[dayOfWeek];
  const startIso = `${baseDateStr}T${startTime}:00`;
  const endIso = `${baseDateStr}T${endTime}:00`;

  const startDate = toDate(startIso, { timeZone: oldTz });
  let endDate = toDate(endIso, { timeZone: oldTz });

  if (endDate <= startDate) {
    endDate = addDays(endDate, 1);
  }

  const newStartDayStr = formatInTimeZone(startDate, newTz, "yyyy-MM-dd");
  const newStartDayOfWeek = toDate(startDate, { timeZone: newTz }).getDay();
  const newStartTimeStr = formatInTimeZone(startDate, newTz, "HH:mm");

  const newEndDayStr = formatInTimeZone(endDate, newTz, "yyyy-MM-dd");
  const newEndDayOfWeek = toDate(endDate, { timeZone: newTz }).getDay();
  const newEndTimeStr = formatInTimeZone(endDate, newTz, "HH:mm");

  if (newStartDayStr === newEndDayStr) {
    return [
      {
        dayOfWeek: newStartDayOfWeek,
        startTime: newStartTimeStr,
        endTime: newEndTimeStr,
      },
    ];
  } else {
    return [
      {
        dayOfWeek: newStartDayOfWeek,
        startTime: newStartTimeStr,
        endTime: "23:59",
      },
      {
        dayOfWeek: newEndDayOfWeek,
        startTime: "00:00",
        endTime: newEndTimeStr,
      },
    ];
  }
}

/**
 * Converts specific date override from old timezone to new timezone.
 */
export function convertDateOverride(
  date: Date,
  isBlocked: boolean,
  startTime: string | null,
  endTime: string | null,
  oldTz: string,
  newTz: string
): { date: Date; startTime: string | null; endTime: string | null }[] {
  if (isBlocked || !startTime || !endTime) {
    return [{ date, startTime, endTime }];
  }

  const dateStr = formatInTimeZone(date, oldTz, "yyyy-MM-dd");
  const startIso = `${dateStr}T${startTime}:00`;
  const endIso = `${dateStr}T${endTime}:00`;

  const startDate = toDate(startIso, { timeZone: oldTz });
  let endDate = toDate(endIso, { timeZone: oldTz });

  if (endDate <= startDate) {
    endDate = addDays(endDate, 1);
  }

  const newStartDayStr = formatInTimeZone(startDate, newTz, "yyyy-MM-dd");
  const newStartTimeStr = formatInTimeZone(startDate, newTz, "HH:mm");

  const newEndDayStr = formatInTimeZone(endDate, newTz, "yyyy-MM-dd");
  const newEndTimeStr = formatInTimeZone(endDate, newTz, "HH:mm");

  if (newStartDayStr === newEndDayStr) {
    return [
      {
        date: new Date(newStartDayStr),
        startTime: newStartTimeStr,
        endTime: newEndTimeStr,
      },
    ];
  } else {
    return [
      {
        date: new Date(newStartDayStr),
        startTime: newStartTimeStr,
        endTime: "23:59",
      },
      {
        date: new Date(newEndDayStr),
        startTime: "00:00",
        endTime: newEndTimeStr,
      },
    ];
  }
}

/**
 * Main execution pipeline to migrate tenant schedule and date override times
 * when they change their base profile timezone.
 */
export async function runTimezoneMigrationPipeline(
  userId: string,
  oldTz: string,
  newTz: string
) {
  if (oldTz === newTz) return;

  const schedules = await prisma.schedule.findMany({
    where: { userId },
  });

  const overrides = await prisma.dateOverride.findMany({
    where: { userId },
  });

  // Calculate new schedules
  const newSchedulesData: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    userId: string;
    isActive: boolean;
    availabilityScheduleId: string | null;
  }[] = [];

  schedules.forEach((s) => {
    const converted = convertWeeklySchedule(
      s.dayOfWeek,
      s.startTime,
      s.endTime,
      oldTz,
      newTz
    );
    converted.forEach((cs) => {
      newSchedulesData.push({
        dayOfWeek: cs.dayOfWeek,
        startTime: cs.startTime,
        endTime: cs.endTime,
        userId,
        isActive: s.isActive,
        availabilityScheduleId: s.availabilityScheduleId,
      });
    });
  });

  // Calculate new overrides
  const newOverridesData: {
    date: Date;
    isBlocked: boolean;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
    userId: string;
  }[] = [];

  overrides.forEach((o) => {
    const converted = convertDateOverride(
      o.date,
      o.isBlocked,
      o.startTime,
      o.endTime,
      oldTz,
      newTz
    );
    converted.forEach((co) => {
      newOverridesData.push({
        date: co.date,
        isBlocked: o.isBlocked,
        startTime: co.startTime,
        endTime: co.endTime,
        reason: o.reason,
        userId,
      });
    });
  });

  // Execute atomic replacement transaction
  await prisma.$transaction(async (tx) => {
    // 1. Delete old schedules
    await tx.schedule.deleteMany({
      where: { userId },
    });

    // 2. Insert new schedules
    if (newSchedulesData.length > 0) {
      await tx.schedule.createMany({
        data: newSchedulesData,
      });
    }

    // 3. Delete old overrides
    await tx.dateOverride.deleteMany({
      where: { userId },
    });

    // 4. Insert new overrides
    if (newOverridesData.length > 0) {
      for (const override of newOverridesData) {
        await tx.dateOverride.create({
          data: override,
        });
      }
    }
  });
}

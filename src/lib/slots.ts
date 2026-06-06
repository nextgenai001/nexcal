import { prisma } from './prisma';
import { addMinutes, isBefore, isAfter } from 'date-fns';
import { toDate, formatInTimeZone } from 'date-fns-tz';

export interface Slot {
  startTimeUtc: Date;
  endTimeUtc: Date;
}

export async function getAvailableSlots(
  userId: string,
  eventTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<Slot[]> {
  // 1. Fetch user to get timezone & global breaks
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: { timezone: true, globalBreaks: true }
  });
  if (!user) throw new Error('User not found or inactive');
  const tenantTimezone = user.timezone || 'UTC';
  
  const globalBreaks = Array.isArray(user.globalBreaks)
    ? (user.globalBreaks as { startTime: string; endTime: string }[])
    : [];

  // 2. Fetch EventType
  const eventType = await prisma.eventType.findUnique({
    where: { id: eventTypeId, isActive: true }
  });
  if (!eventType) throw new Error('EventType not found or inactive');

  const duration = eventType.duration;
  const buffer = eventType.bufferTime;

  // 3. Fetch Schedules & Overrides
  const schedules = await prisma.schedule.findMany({
    where: { userId, isActive: true }
  });

  // We should fetch overrides that overlap the requested period
  // We'll just fetch all for the user and filter in memory, or use a date range.
  const overrides = await prisma.dateOverride.findMany({
    where: { userId }
  });

  // 4. Fetch Bookings
  // Also include eventType buffer time to calculate blocked time accurately
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      status: { in: ['CONFIRMED', 'PENDING'] },
      startTime: { gte: new Date(startDate.getTime() - 24 * 60 * 60 * 1000) }, // Add some margin
      endTime: { lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000) }
    },
    include: {
      eventType: {
        select: { bufferTime: true }
      }
    }
  });

  const availableSlots: Slot[] = [];
  const nowUtc = new Date();

  // Iterate days in tenant timezone
  const startStr = formatInTimeZone(startDate, tenantTimezone, 'yyyy-MM-dd');
  const endStr = formatInTimeZone(endDate, tenantTimezone, 'yyyy-MM-dd');

  let currentDayStr = startStr;
  let daysCount = 0;
  const MAX_DAYS = 90; // safety limit

  while (currentDayStr <= endStr && daysCount < MAX_DAYS) {
    // Determine active windows for the day
    let activeWindows: { start: string; end: string }[] = [];
    
    // Find override
    const override = overrides.find(
      o => o.date.toISOString().split('T')[0] === currentDayStr
    );

    if (override) {
      if (!override.isBlocked && override.startTime && override.endTime) {
        activeWindows.push({ start: override.startTime, end: override.endTime });
      }
    } else {
      // No override, use regular schedule
      // We need to know what day of week `currentDayStr` is in the tenant timezone.
      const dateInTenantTz = toDate(`${currentDayStr}T12:00:00`, { timeZone: tenantTimezone });
      const dayOfWeek = dateInTenantTz.getDay(); // 0=Sun, 1=Mon...
      
      const daySchedules = schedules.filter(s => s.dayOfWeek === dayOfWeek);
      for (const s of daySchedules) {
        activeWindows.push({ start: s.startTime, end: s.endTime });
      }
    }

    // Subtract global breaks
    for (const brk of globalBreaks) {
      if (brk.startTime && brk.endTime) {
        activeWindows = subtractSingleBreak(activeWindows, brk);
      }
    }

    // Generate slots for each window
    for (const window of activeWindows) {
      const windowStartLocal = `${currentDayStr}T${window.start}:00`;
      const windowEndLocal = `${currentDayStr}T${window.end}:00`;

      let currentStartUtc = toDate(windowStartLocal, { timeZone: tenantTimezone });
      const windowEndUtc = toDate(windowEndLocal, { timeZone: tenantTimezone });

      while (true) {
        const slotEndUtc = addMinutes(currentStartUtc, duration);
        if (isAfter(slotEndUtc, windowEndUtc)) {
          break;
        }

        // Check if slot is in the past
        if (isBefore(currentStartUtc, nowUtc)) {
          currentStartUtc = addMinutes(currentStartUtc, duration + buffer);
          continue;
        }

        // Check against bookings
        // booking blocks time from b.startTime to (b.endTime + b.eventType.bufferTime)
        const isOverlapping = bookings.some(b => {
          const bStart = b.startTime;
          const bEndWithBuffer = addMinutes(b.endTime, b.eventType?.bufferTime || 0);
          const slotEndWithBufferUtc = addMinutes(slotEndUtc, buffer);
          
          // Slot overlap condition:
          // New slot (including its buffer) overlaps with existing booking (including its buffer)
          return currentStartUtc < bEndWithBuffer && slotEndWithBufferUtc > bStart;
        });

        if (!isOverlapping) {
          availableSlots.push({
            startTimeUtc: currentStartUtc,
            endTimeUtc: slotEndUtc
          });
        }

        currentStartUtc = addMinutes(currentStartUtc, duration + buffer);
      }
    }

    // Increment day
    const d = new Date(`${currentDayStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    currentDayStr = d.toISOString().split('T')[0];
    daysCount++;
  }

  return availableSlots;
}

// Subtracts a single break from an array of active windows
function subtractSingleBreak(
  windows: { start: string; end: string }[],
  brk: { startTime: string; endTime: string }
): { start: string; end: string }[] {
  const result: { start: string; end: string }[] = [];
  const bStart = brk.startTime;
  const bEnd = brk.endTime;

  for (const w of windows) {
    if (bEnd <= w.start || bStart >= w.end) {
      // No overlap
      result.push(w);
    } else if (bStart <= w.start && bEnd >= w.end) {
      // Break completely covers window
      continue;
    } else if (bStart > w.start && bEnd < w.end) {
      // Break splits the window in two
      result.push({ start: w.start, end: bStart });
      result.push({ start: bEnd, end: w.end });
    } else if (bStart <= w.start && bEnd > w.start && bEnd < w.end) {
      // Break overlaps the start of window
      result.push({ start: bEnd, end: w.end });
    } else if (bStart > w.start && bStart < w.end && bEnd >= w.end) {
      // Break overlaps the end of window
      result.push({ start: w.start, end: bStart });
    }
  }

  return result;
}

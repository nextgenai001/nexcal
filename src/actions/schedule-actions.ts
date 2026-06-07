"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function updateScheduleAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const scheduleId = formData.get("scheduleId") as string;
    if (!scheduleId) {
      throw new Error("Availability Schedule ID is required");
    }

    // Parse schedules (array of { dayOfWeek: number, ranges: { startTime, endTime }[], isActive: boolean })
    const schedulesRaw = formData.get("schedules") as string;
    const schedules = JSON.parse(schedulesRaw) as {
      dayOfWeek: number;
      ranges: { startTime: string; endTime: string }[];
      isActive: boolean;
    }[];

    // Parse globalBreaks (array of { startTime: string, endTime: string })
    const globalBreaksRaw = formData.get("globalBreaks") as string;
    const globalBreaks = globalBreaksRaw ? JSON.parse(globalBreaksRaw) : [];

    // Verify schedule group ownership
    const scheduleGroup = await prisma.availabilitySchedule.findFirst({
      where: { id: scheduleId, userId: user.id }
    });
    if (!scheduleGroup) {
      throw new Error("Availability schedule not found");
    }

    // Delete existing schedules for this specific schedule group
    await prisma.schedule.deleteMany({
      where: { userId: user.id, availabilityScheduleId: scheduleId },
    });

    // Update global breaks on the User profile
    await prisma.user.update({
      where: { id: user.id },
      data: {
        globalBreaks: globalBreaks,
      },
    });

    // Create new schedules (one row per active daily range)
    const insertData: { dayOfWeek: number; startTime: string; endTime: string; userId: string; availabilityScheduleId: string; isActive: boolean }[] = [];

    schedules.forEach(s => {
      if (s.isActive && Array.isArray(s.ranges)) {
        s.ranges.forEach(r => {
          if (r.startTime && r.endTime) {
            insertData.push({
              dayOfWeek: s.dayOfWeek,
              startTime: r.startTime,
              endTime: r.endTime,
              userId: user.id,
              availabilityScheduleId: scheduleId,
              isActive: true,
            });
          }
        });
      }
    });

    if (insertData.length > 0) {
      await prisma.schedule.createMany({
        data: insertData,
      });
    }

    revalidatePath("/user/schedule");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAvailabilityScheduleAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    const name = formData.get("name") as string;
    if (!name || !name.trim()) {
      throw new Error("Schedule name is required");
    }

    const newSchedule = await prisma.availabilitySchedule.create({
      data: {
        name: name.trim(),
        userId: user.id,
        isDefault: false,
      }
    });

    revalidatePath("/user/schedule");
    return { success: true, scheduleId: newSchedule.id, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function renameAvailabilityScheduleAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    const scheduleId = formData.get("scheduleId") as string;
    const name = formData.get("name") as string;
    if (!scheduleId || !name || !name.trim()) {
      throw new Error("Invalid parameters");
    }

    await prisma.availabilitySchedule.update({
      where: { id: scheduleId, userId: user.id },
      data: { name: name.trim() }
    });

    revalidatePath("/user/schedule");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAvailabilityScheduleAction(scheduleId: string) {
  try {
    const user = await requireTenant();

    const schedule = await prisma.availabilitySchedule.findFirst({
      where: { id: scheduleId, userId: user.id }
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    if (schedule.isDefault) {
      throw new Error("Cannot delete the default schedule");
    }

    await prisma.availabilitySchedule.delete({
      where: { id: scheduleId }
    });

    revalidatePath("/user/schedule");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addDateOverrideAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const dateStr = formData.get("date") as string;
    const isBlocked = formData.get("isBlocked") === "true";
    const startTime = formData.get("startTime") as string || null;
    const endTime = formData.get("endTime") as string || null;
    const reason = formData.get("reason") as string || null;

    if (!dateStr) {
      throw new Error("Date is required");
    }

    await prisma.dateOverride.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(dateStr),
        }
      },
      update: {
        isBlocked,
        startTime: isBlocked ? null : startTime,
        endTime: isBlocked ? null : endTime,
        reason,
      },
      create: {
        date: new Date(dateStr),
        isBlocked,
        startTime: isBlocked ? null : startTime,
        endTime: isBlocked ? null : endTime,
        reason,
        userId: user.id,
      },
    });

    revalidatePath("/user/schedule");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDateOverrideAction(id: string) {
  try {
    const user = await requireTenant();
    
    await prisma.dateOverride.delete({
      where: { id, userId: user.id },
    });

    revalidatePath("/user/schedule");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

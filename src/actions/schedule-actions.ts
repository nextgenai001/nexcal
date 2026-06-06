"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function updateScheduleAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    // schedules logic: 
    // formData contains days and their start/end times
    // For simplicity, we'll parse a JSON from a hidden field
    const schedulesRaw = formData.get("schedules") as string;
    const schedules = JSON.parse(schedulesRaw) as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isActive: boolean;
    }[];

    // Delete existing schedules for this user
    await prisma.schedule.deleteMany({
      where: { userId: user.id },
    });

    // Create new schedules
    const activeSchedules = schedules.filter(s => s.isActive);
    if (activeSchedules.length > 0) {
      await prisma.schedule.createMany({
        data: activeSchedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: true,
          userId: user.id,
        })),
      });
    }

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

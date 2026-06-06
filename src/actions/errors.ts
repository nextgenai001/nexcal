"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function logErrorAction(
  message: string,
  stack?: string,
  path?: string,
  component: "CLIENT" | "SERVER" | "API" = "SERVER",
  metadata: any = {}
) {
  try {
    const user = await getCurrentUser();

    await prisma.errorLog.create({
      data: {
        message,
        stack: stack || null,
        path: path || null,
        component,
        userId: user?.id || null,
        metadata: metadata || {},
      },
    });
  } catch (e) {
    console.error("Failed to write error log to database:", e);
  }
}

export async function deleteErrorLogAction(id: string) {
  try {
    await requireAdmin();

    await prisma.errorLog.delete({
      where: { id },
    });

    revalidatePath("/admin/errors");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to delete error log" };
  }
}

export async function clearAllErrorLogsAction() {
  try {
    await requireAdmin();

    await prisma.errorLog.deleteMany({});

    revalidatePath("/admin/errors");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to clear error logs" };
  }
}

export async function updateRetentionDaysAction(days: number) {
  try {
    await requireAdmin();

    if (isNaN(days) || days < 1) {
      return { error: "Retention days must be at least 1" };
    }

    await prisma.systemSetting.upsert({
      where: { key: "error_log_retention_days" },
      update: { value: String(days) },
      create: { key: "error_log_retention_days", value: String(days) },
    });

    revalidatePath("/admin/errors");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update retention policy" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getDataScope } from "@/lib/rbac";
import { getTranslator } from "@/lib/i18n/server";

// ============================================================
// Action Result Type
// ============================================================

type ActionResult = { error: string | null; success: boolean };

// ============================================================
// Create Service
// ============================================================

export async function createServiceAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { t } = await getTranslator();
  try {
    const scope = await getDataScope();
    if (!scope) return { error: t("errors.unauthorized"), success: false };

    const raw = formData.get("payload") as string;

    const createServiceSchema = z.object({
      name: z.string().min(2, t("errors.serviceNameMin")),
      duration: z.number().min(5, t("errors.durationMin")).max(480, t("errors.durationMax")),
      bufferTime: z.number().min(0).max(60).default(0),
      price: z.number().min(0).default(0),
      dpPercentage: z.number().min(0).max(100).default(0),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t("errors.invalidHexColor")).optional(),
      isVirtual: z.boolean().default(false),
    });

    const parsed = createServiceSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || t("errors.invalidData"), success: false };
    }

    const { name, duration, bufferTime, price, dpPercentage, description, color, isVirtual } = parsed.data;

    await prisma.serviceType.create({
      data: {
        name,
        duration,
        bufferTime,
        price,
        dpPercentage,
        description: description || null,
        color: color || null,
        isVirtual,
        userId: scope.currentUserId,
      },
    });

    revalidatePath("/admin/services");
    return { error: null, success: true };
  } catch {
    return { error: t("errors.createServiceFailed"), success: false };
  }
}

// ============================================================
// Update Service
// ============================================================

export async function updateServiceAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const { t } = await getTranslator();
  try {
    const scope = await getDataScope();
    if (!scope) return { error: t("errors.unauthorized"), success: false };

    const raw = formData.get("payload") as string;

    const updateServiceSchema = z.object({
      name: z.string().min(2, t("errors.serviceNameMin")),
      duration: z.number().min(5, t("errors.durationMin")).max(480, t("errors.durationMax")),
      bufferTime: z.number().min(0).max(60).default(0),
      price: z.number().min(0).default(0),
      dpPercentage: z.number().min(0).max(100).default(0),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t("errors.invalidHexColor")).optional(),
      isVirtual: z.boolean().default(false),
      id: z.string(),
      isActive: z.boolean().optional(),
    });

    const parsed = updateServiceSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || t("errors.invalidData"), success: false };
    }

    const { id, name, duration, bufferTime, price, dpPercentage, description, color, isActive, isVirtual } = parsed.data;

    // Verify ownership (OWNER can edit any org member's service, STAFF only their own)
    const existing = await prisma.serviceType.findFirst({
      where: { id, ...scope.userFilter },
    });
    if (!existing) return { error: t("errors.serviceNotFound"), success: false };

    await prisma.serviceType.update({
      where: { id },
      data: {
        name,
        duration,
        bufferTime,
        price,
        dpPercentage,
        description: description || null,
        color: color || null,
        isVirtual,
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    revalidatePath("/admin/services");
    return { error: null, success: true };
  } catch {
    return { error: t("errors.updateServiceFailed"), success: false };
  }
}

// ============================================================
// Delete Service
// ============================================================

export async function deleteServiceAction(serviceId: string): Promise<ActionResult> {
  const { t } = await getTranslator();
  try {
    const scope = await getDataScope();
    if (!scope) return { error: t("errors.unauthorized"), success: false };

    // Verify ownership
    const existing = await prisma.serviceType.findFirst({
      where: { id: serviceId, userId: scope.currentUserId },
    });
    if (!existing) return { error: t("errors.serviceNotFound"), success: false };

    // Check if service has bookings
    const bookingCount = await prisma.booking.count({
      where: { serviceTypeId: serviceId },
    });

    if (bookingCount > 0) {
      // Soft delete: deactivate instead
      await prisma.serviceType.update({
        where: { id: serviceId },
        data: { isActive: false },
      });
      revalidatePath("/admin/services");
      return { error: null, success: true };
    }

    await prisma.serviceType.delete({ where: { id: serviceId } });
    revalidatePath("/admin/services");
    return { error: null, success: true };
  } catch {
    return { error: t("errors.deleteServiceFailed"), success: false };
  }
}

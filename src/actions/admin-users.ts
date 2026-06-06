"use server";

/**
 * ============================================================
 * NexCal — Admin User Management Actions
 * ============================================================
 * All actions require PLATFORM_ADMIN role (enforced via requireAdmin()).
 * All DB writes create an AuditLog entry for traceability.
 * ============================================================
 */

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logErrorAction } from "@/actions/errors";

// ── Zod schemas ─────────────────────────────────────────────────────────────

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezone: z.string().min(1, "Timezone is required"),
  businessName: z.string().optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  businessName: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Types ───────────────────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function writeAuditLog({
  action,
  actorId,
  targetId,
  metadata,
}: {
  action: string;
  actorId: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action,
      actorId,
      targetId: targetId ?? null,
      metadata: metadata ? (metadata as any) : {},
    },
  });
}

// ── createTenantAction ───────────────────────────────────────────────────────

/**
 * Create a new TENANT user account.
 * Called from /admin/users/new
 */
export async function createTenantAction(
  state: ActionResult<{ userId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ userId: string }>> {
  try {
    const admin = await requireAdmin();

    const raw = {
      name: formData.get("name"),
      username: (formData.get("username") as string | null)?.toLowerCase() ?? "",
      email: (formData.get("email") as string | null)?.toLowerCase() ?? "",
      password: formData.get("password"),
      timezone: formData.get("timezone"),
      businessName: formData.get("businessName") || undefined,
    };

    const parsed = createTenantSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
      return { error: firstError };
    }

    const { name, username, email, password, timezone, businessName } = parsed.data;

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return { error: `Username "@${username}" is already taken` };
    }

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { error: `Email "${email}" is already registered` };
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        hashedPassword,
        timezone,
        businessName: businessName ?? null,
        role: "TENANT",
        isActive: true,
      },
    });

    // Audit log
    await writeAuditLog({
      action: "USER_CREATED",
      actorId: admin.id,
      targetId: user.id,
      metadata: { username, email, timezone },
    });

    revalidatePath("/admin/users");

    return { data: { userId: user.id } };
  } catch (err: any) {
    console.error("[createTenantAction]", err);
    await logErrorAction(err?.message || "Failed to create tenant", err?.stack, "/admin/users/new", "SERVER", { action: "createTenantAction" });
    return { error: "Failed to create tenant. Please try again." };
  }
}

// ── updateTenantAction ───────────────────────────────────────────────────────

/**
 * Update a tenant's profile fields (name, email, businessName, timezone).
 */
export async function updateTenantAction(
  tenantId: string,
  state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const raw = {
      name: formData.get("name"),
      email: (formData.get("email") as string | null)?.toLowerCase() ?? "",
      businessName: formData.get("businessName") || undefined,
      timezone: formData.get("timezone"),
    };

    const parsed = updateTenantSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
      return { error: firstError };
    }

    const { name, email, businessName, timezone } = parsed.data;

    // Ensure tenant exists and is indeed a TENANT
    const existing = await prisma.user.findUnique({ where: { id: tenantId } });
    if (!existing || existing.role !== "TENANT") {
      return { error: "Tenant not found" };
    }

    // Check email uniqueness (if changed)
    if (email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return { error: `Email "${email}" is already registered` };
      }
    }

    await prisma.user.update({
      where: { id: tenantId },
      data: {
        name,
        email,
        businessName: businessName ?? null,
        timezone,
      },
    });

    await writeAuditLog({
      action: "USER_UPDATED",
      actorId: admin.id,
      targetId: tenantId,
      metadata: { name, email, timezone },
    });

    revalidatePath(`/admin/users/${tenantId}`);
    revalidatePath("/admin/users");

    return {};
  } catch (err: any) {
    console.error("[updateTenantAction]", err);
    await logErrorAction(err?.message || "Failed to update tenant", err?.stack, `/admin/users/${tenantId}`, "SERVER", { action: "updateTenantAction", tenantId });
    return { error: "Failed to update tenant. Please try again." };
  }
}

// ── resetTenantPasswordAction ─────────────────────────────────────────────────

/**
 * Reset a tenant's password (admin-initiated).
 */
export async function resetTenantPasswordAction(
  tenantId: string,
  state: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const raw = { password: formData.get("password") };
    const parsed = resetPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Validation failed";
      return { error: firstError };
    }

    const existing = await prisma.user.findUnique({ where: { id: tenantId } });
    if (!existing || existing.role !== "TENANT") {
      return { error: "Tenant not found" };
    }

    const hashedPassword = await hash(parsed.data.password, 12);

    await prisma.user.update({
      where: { id: tenantId },
      data: { hashedPassword },
    });

    await writeAuditLog({
      action: "USER_PASSWORD_RESET",
      actorId: admin.id,
      targetId: tenantId,
      metadata: {},
    });

    return {};
  } catch (err: any) {
    console.error("[resetTenantPasswordAction]", err);
    await logErrorAction(err?.message || "Failed to reset password", err?.stack, `/admin/users/${tenantId}`, "SERVER", { action: "resetTenantPasswordAction", tenantId });
    return { error: "Failed to reset password. Please try again." };
  }
}

// ── toggleTenantActiveAction ──────────────────────────────────────────────────

/**
 * Flip a tenant's isActive status (activate / deactivate).
 */
export async function toggleTenantActiveAction(
  tenantId: string
): Promise<ActionResult<{ isActive: boolean }>> {
  try {
    const admin = await requireAdmin();

    const existing = await prisma.user.findUnique({ where: { id: tenantId } });
    if (!existing || existing.role !== "TENANT") {
      return { error: "Tenant not found" };
    }

    const newActive = !existing.isActive;

    await prisma.user.update({
      where: { id: tenantId },
      data: { isActive: newActive },
    });

    await writeAuditLog({
      action: newActive ? "USER_REACTIVATED" : "USER_DEACTIVATED",
      actorId: admin.id,
      targetId: tenantId,
      metadata: { username: existing.username },
    });

    revalidatePath(`/admin/users/${tenantId}`);
    revalidatePath("/admin/users");

    return { data: { isActive: newActive } };
  } catch (err: any) {
    console.error("[toggleTenantActiveAction]", err);
    await logErrorAction(err?.message || "Failed to toggle active status", err?.stack, `/admin/users/${tenantId}`, "SERVER", { action: "toggleTenantActiveAction", tenantId });
    return { error: "Failed to update tenant status. Please try again." };
  }
}

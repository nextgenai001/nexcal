"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function createWebhookAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const url = formData.get("url") as string;
    const secret = formData.get("secret") as string || null;
    const events = formData.getAll("events") as string[];
    let eventTypeId = formData.get("eventTypeId") as string || null;
    if (eventTypeId === "all") {
      eventTypeId = null;
    }
    
    if (!url) {
      throw new Error("URL is required");
    }

    if (events.length === 0) {
      throw new Error("Select at least one event");
    }

    await prisma.webhookEndpoint.create({
      data: {
        userId: user.id,
        url,
        secret,
        events,
        eventTypeId,
      },
    });

    revalidatePath("/user/webhooks");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateWebhookAction(id: string, prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const url = formData.get("url") as string;
    const secret = formData.get("secret") as string || null;
    const events = formData.getAll("events") as string[];
    let eventTypeId = formData.get("eventTypeId") as string || null;
    if (eventTypeId === "all") {
      eventTypeId = null;
    }
    
    if (!url) {
      throw new Error("URL is required");
    }

    if (events.length === 0) {
      throw new Error("Select at least one event");
    }

    await prisma.webhookEndpoint.update({
      where: { id, userId: user.id },
      data: {
        url,
        secret,
        events,
        eventTypeId,
      },
    });

    revalidatePath("/user/webhooks");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteWebhookAction(id: string) {
  try {
    const user = await requireTenant();
    
    await prisma.webhookEndpoint.delete({
      where: { id, userId: user.id },
    });

    revalidatePath("/user/webhooks");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleWebhookAction(id: string, isActive: boolean) {
  try {
    const user = await requireTenant();
    
    await prisma.webhookEndpoint.update({
      where: { id, userId: user.id },
      data: { isActive },
    });

    revalidatePath("/user/webhooks");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function toggleEventTypeAction(id: string, isActive: boolean) {
  const user = await requireTenant();
  
  await prisma.eventType.update({
    where: { id, userId: user.id },
    data: { isActive },
  });
  
  revalidatePath("/user/events");
}

export async function deleteEventTypeAction(id: string) {
  const user = await requireTenant();
  
  await prisma.eventType.delete({
    where: { id, userId: user.id },
  });
  
  revalidatePath("/user/events");
}

export async function createEventTypeAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const customFieldsRaw = formData.get("customFields") as string;
    
    const customFields = customFieldsRaw ? JSON.parse(customFieldsRaw) : [];

    // Check duplicate slug for the same user
    const existing = await prisma.eventType.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        },
      },
    });
    if (existing) {
      return { success: false, error: "An event type with this URL slug already exists." };
    }

    await prisma.eventType.create({
      data: {
        name,
        slug,
        description,
        duration,
        customFields,
        userId: user.id,
      },
    });

    revalidatePath("/user/events");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEventTypeAction(id: string, prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string, 10);
    const customFieldsRaw = formData.get("customFields") as string;
    
    const customFields = customFieldsRaw ? JSON.parse(customFieldsRaw) : [];

    // Check duplicate slug for the same user
    const existing = await prisma.eventType.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        },
      },
    });
    if (existing && existing.id !== id) {
      return { success: false, error: "An event type with this URL slug already exists." };
    }

    await prisma.eventType.update({
      where: { id, userId: user.id },
      data: {
        name,
        slug,
        description,
        duration,
        customFields,
      },
    });

    revalidatePath("/user/events");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

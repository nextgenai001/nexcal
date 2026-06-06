"use server";

import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { BookingStatus } from "@prisma/client";
import { dispatchWebhookEvent } from "@/lib/webhooks/dispatcher";

export async function createManualBookingAction(prevState: any, formData: FormData) {
  try {
    const user = await requireTenant();
    
    const eventTypeId = formData.get("eventTypeId") as string;
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;
    
    if (!eventTypeId || !customerName || !dateStr || !timeStr) {
      throw new Error("Missing required fields");
    }

    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId, userId: user.id },
    });

    if (!eventType) {
      throw new Error("Event type not found");
    }

    // Parse date and time in UTC for now (simplification)
    // Normally, this would use the user's timezone to compute UTC
    const startDateTimeStr = `${dateStr}T${timeStr}:00Z`;
    const startTime = new Date(startDateTimeStr);
    
    const endTime = new Date(startTime.getTime() + eventType.duration * 60000);

    await prisma.booking.create({
      data: {
        userId: user.id,
        eventTypeId,
        customerName,
        customerEmail,
        startTime,
        endTime,
        status: BookingStatus.CONFIRMED,
      },
    });

    revalidatePath("/user/bookings");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBookingStatusAction(id: string, status: BookingStatus) {
  try {
    const user = await requireTenant();
    
    const updated = await prisma.booking.update({
      where: { id, userId: user.id },
      data: { status },
    });

    if (status === BookingStatus.COMPLETED) {
      dispatchWebhookEvent('BOOKING_COMPLETED', updated, updated.userId, updated.id).catch(console.error);
    } else if (status === BookingStatus.NO_SHOW) {
      dispatchWebhookEvent('BOOKING_NO_SHOW', updated, updated.userId, updated.id).catch(console.error);
    } else if (status === BookingStatus.CANCELLED) {
      dispatchWebhookEvent('BOOKING_CANCELLED', updated, updated.userId, updated.id).catch(console.error);
    }

    revalidatePath(`/user/bookings/${id}`);
    revalidatePath("/user/bookings");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateBookingNotesAction(id: string, notes: string) {
  try {
    const user = await requireTenant();
    
    await prisma.booking.update({
      where: { id, userId: user.id },
      data: { notes },
    });

    revalidatePath(`/user/bookings/${id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelBookingAction(id: string, cancelReason: string) {
  try {
    const user = await requireTenant();
    
    const updated = await prisma.booking.update({
      where: { id, userId: user.id },
      data: { 
        status: BookingStatus.CANCELLED,
        cancelReason 
      },
    });

    dispatchWebhookEvent('BOOKING_CANCELLED', updated, updated.userId, updated.id).catch(console.error);

    revalidatePath(`/user/bookings/${id}`);
    revalidatePath("/user/bookings");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

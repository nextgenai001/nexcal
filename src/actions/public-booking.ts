"use server";

import { prisma } from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/slots';
import { startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatcher';

export async function getMonthSlotsAction(
  username: string,
  slug: string,
  monthStr: string,
  viewerTimezone: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username, isActive: true }
    });
    if (!user) return { error: 'User not found' };

    const eventType = await prisma.eventType.findUnique({
      where: {
        userId_slug: { userId: user.id, slug }
      }
    });
    if (!eventType || !eventType.isActive) return { error: 'Event type not found' };

    // Month string e.g. "2023-10"
    const start = startOfMonth(parseISO(`${monthStr}-01`));
    const end = endOfMonth(start);

    const slots = await getAvailableSlots(user.id, eventType.id, start, end);

    // Filter out slots that would be too close to maxBookingsPerDay etc, but for now just return them
    // Convert to ISO string format for JSON serialization
    const data = slots.map(s => ({
      startTimeUtc: s.startTimeUtc.toISOString(),
      endTimeUtc: s.endTimeUtc.toISOString()
    }));

    return { data };
  } catch (error: any) {
    console.error('getMonthSlotsAction error:', error);
    return { error: 'Failed to fetch slots' };
  }
}

export async function submitBookingAction(
  username: string,
  slug: string,
  slotStartTimeUtc: string,
  formData: any
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username, isActive: true }
    });
    if (!user) return { error: 'User not found' };

    const eventType = await prisma.eventType.findUnique({
      where: {
        userId_slug: { userId: user.id, slug }
      }
    });
    if (!eventType || !eventType.isActive) return { error: 'Event type not found' };

    const startTime = parseISO(slotStartTimeUtc);
    if (!isValid(startTime)) return { error: 'Invalid start time' };

    // Prevent race conditions: check if this slot is still available
    // We only need to check around this specific time
    const checkStart = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    const checkEnd = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const availableSlots = await getAvailableSlots(user.id, eventType.id, checkStart, checkEnd);
    
    const slotAvailable = availableSlots.some(
      s => s.startTimeUtc.getTime() === startTime.getTime()
    );

    if (!slotAvailable) {
      return { error: 'This time slot is no longer available. Please select another time.' };
    }

    const endTime = new Date(startTime.getTime() + eventType.duration * 60000);

    // Parse custom fields configuration to get default fields setup
    const config = eventType.customFields;
    const defaults = {
      name: { enabled: true, required: true },
      email: { enabled: true, required: true },
      phone: { enabled: false, required: false },
      guests: { enabled: false, required: false },
      meeting_about: { enabled: false, required: false },
      notes: { enabled: false, required: false }
    };
    
    const defaultFields = config && typeof config === "object" && !Array.isArray(config)
      ? { ...defaults, ...(config as any).defaultFields }
      : defaults;

    // Validate enabled & required fields
    if (defaultFields.name.enabled && defaultFields.name.required && !formData.name) {
      return { error: 'Full Name is required' };
    }
    if (defaultFields.email.enabled && defaultFields.email.required && !formData.email) {
      return { error: 'Email Address is required' };
    }
    if (defaultFields.phone.enabled && defaultFields.phone.required && !formData.phone) {
      return { error: 'Phone Number is required' };
    }
    if (defaultFields.guests.enabled && defaultFields.guests.required && !formData.guests) {
      return { error: 'Guest email list is required' };
    }
    if (defaultFields.meeting_about.enabled && defaultFields.meeting_about.required && !formData.meeting_about) {
      return { error: 'Meeting details are required' };
    }
    if (defaultFields.notes.enabled && defaultFields.notes.required && !formData.notes) {
      return { error: 'Additional notes are required' };
    }

    const { name, email, phone, guests, meeting_about, notes, ...customFieldData } = formData;

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        eventTypeId: eventType.id,
        status: 'CONFIRMED',
        startTime,
        endTime,
        customerName: name || '',
        customerEmail: email || '',
        customerPhone: phone || null,
        customFieldData: {
          ...(customFieldData || {}),
          ...(guests ? { guests } : {}),
          ...(meeting_about ? { meeting_about } : {}),
          ...(notes ? { notes } : {})
        },
      }
    });

    dispatchWebhookEvent('BOOKING_CREATED', booking, booking.userId, booking.id).catch(err => {
      console.error('Failed to trigger webhook dispatch', err);
    });

    return { data: { managementToken: booking.managementToken } };
  } catch (error: any) {
    console.error('submitBookingAction error:', error);
    return { error: 'Failed to create booking' };
  }
}

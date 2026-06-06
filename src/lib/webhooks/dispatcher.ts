import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Dispatches a webhook event to all active endpoints subscribed to it for a user.
 * 
 * @param event The event name (e.g. 'BOOKING_CREATED', 'BOOKING_CANCELLED')
 * @param payload The JSON-serializable payload
 * @param userId The ID of the tenant/user whose webhooks should be fired
 * @param bookingId Optional ID of the booking associated with this event
 */
export async function dispatchWebhookEvent(
  event: string,
  payload: any,
  userId: string,
  bookingId?: string
) {
  try {
    // Find active WebhookEndpoints for the userId where events array includes the event
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    const promises = endpoints.map(async (endpoint) => {
      // Create PENDING delivery
      const delivery = await prisma.webhookDelivery.create({
        data: {
          event,
          payload,
          status: 'PENDING',
          webhookId: endpoint.id,
          bookingId,
        },
      });

      try {
        const payloadString = JSON.stringify(payload);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (endpoint.secret) {
          const signature = crypto
            .createHmac('sha256', endpoint.secret)
            .update(payloadString)
            .digest('hex');
          headers['X-NexCal-Signature'] = signature;
        }

        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: payloadString,
        });

        const responseBodyText = await response.text();
        const responseBody = responseBodyText ? responseBodyText.slice(0, 1000) : undefined;
        
        const isSuccess = response.ok;
        const status = isSuccess ? 'SUCCESS' : 'FAILED';
        // Retry in 5 minutes if it failed initially
        const nextRetryAt = isSuccess ? null : new Date(Date.now() + 1000 * 60 * 5);

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status,
            attempts: 1,
            lastAttemptAt: new Date(),
            responseCode: response.status,
            responseBody,
            nextRetryAt,
          },
        });
      } catch (error: any) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attempts: 1,
            lastAttemptAt: new Date(),
            error: error?.message?.slice(0, 500) || 'Unknown error',
            nextRetryAt: new Date(Date.now() + 1000 * 60 * 5),
          },
        });
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('Error dispatching webhook event:', err);
  }
}

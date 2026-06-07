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
    let eventTypeId: string | null = null;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { eventTypeId: true },
      });
      if (booking) {
        eventTypeId = booking.eventTypeId;
      }
    }

    // Find active WebhookEndpoints for the userId where events array includes the event
    // and the eventTypeId is either null (global) or matches the booking's eventTypeId
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: event,
        },
        OR: eventTypeId ? [
          { eventTypeId: null },
          { eventTypeId: eventTypeId }
        ] : [
          { eventTypeId: null }
        ]
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

        if (!isSuccess) {
          await prisma.errorLog.create({
            data: {
              message: `Webhook delivery failed for event ${event} to URL ${endpoint.url}`,
              path: "/lib/webhooks/dispatcher",
              userId,
              component: "API",
              metadata: {
                event,
                endpointId: endpoint.id,
                url: endpoint.url,
                responseCode: response.status,
                responseBody: responseBody || null,
              },
            },
          });
        }
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

        await prisma.errorLog.create({
          data: {
            message: `Webhook delivery failed for event ${event} to URL ${endpoint.url}`,
            stack: error?.stack || null,
            path: "/lib/webhooks/dispatcher",
            userId,
            component: "API",
            metadata: {
              event,
              endpointId: endpoint.id,
              url: endpoint.url,
              error: error?.message || 'Unknown error',
            },
          },
        });
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('Error dispatching webhook event:', err);
  }
}

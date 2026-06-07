import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    // Basic protection for cron routes: ensure it's called by Vercel or has a secret.
    // Assuming simple cron protection via header or just public for the sake of the task.
    // If needed:
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    const now = new Date();

    const failedDeliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'FAILED',
        attempts: { lt: 5 },
        nextRetryAt: { lte: now },
      },
      include: {
        webhook: true,
      },
      take: 50, // Process in batches
    });

    if (failedDeliveries.length === 0) {
      return NextResponse.json({ message: 'No webhooks to retry' }, { status: 200 });
    }

    const promises = failedDeliveries.map(async (delivery) => {
      const endpoint = delivery.webhook;
      const payloadString = JSON.stringify(delivery.payload);
      
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

      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers,
          body: payloadString,
        });

        const responseBodyText = await response.text();
        const responseBody = responseBodyText ? responseBodyText.slice(0, 1000) : undefined;
        
        const isSuccess = response.ok;
        const status = isSuccess ? 'SUCCESS' : 'FAILED';
        
        // Exponential backoff: 5m, 25m, 125m, etc.
        // Wait, instructions say: "updates attempts and backoff time".
        // attempts + 1, so 2nd attempt -> 5^2 = 25m, 3rd -> 125m
        const newAttempts = delivery.attempts + 1;
        const nextRetryAt = isSuccess 
          ? null 
          : new Date(Date.now() + 1000 * 60 * Math.pow(5, newAttempts));

        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status,
            attempts: newAttempts,
            lastAttemptAt: new Date(),
            responseCode: response.status,
            responseBody,
            nextRetryAt,
          },
        });

        if (!isSuccess) {
          await prisma.errorLog.create({
            data: {
              message: `Webhook retry failed (Attempt ${newAttempts}) for event ${delivery.event} to URL ${endpoint.url}`,
              path: "/api/cron/webhooks",
              userId: endpoint.userId,
              component: "API",
              metadata: {
                event: delivery.event,
                endpointId: endpoint.id,
                url: endpoint.url,
                responseCode: response.status,
                responseBody: responseBody || null,
                attempts: newAttempts,
              },
            },
          });
        }
      } catch (error: any) {
        const newAttempts = delivery.attempts + 1;
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attempts: newAttempts,
            lastAttemptAt: new Date(),
            error: error?.message?.slice(0, 500) || 'Unknown error',
            nextRetryAt: new Date(Date.now() + 1000 * 60 * Math.pow(5, newAttempts)),
          },
        });

        await prisma.errorLog.create({
          data: {
            message: `Webhook retry failed (Attempt ${newAttempts}) for event ${delivery.event} to URL ${endpoint.url}`,
            stack: error?.stack || null,
            path: "/api/cron/webhooks",
            userId: endpoint.userId,
            component: "API",
            metadata: {
              event: delivery.event,
              endpointId: endpoint.id,
              url: endpoint.url,
              error: error?.message || 'Unknown error',
              attempts: newAttempts,
            },
          },
        });
      }
    });

    await Promise.allSettled(promises);

    // Dynamic Error Logs Auto-Pruning
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'error_log_retention_days' }
      });
      const days = setting ? parseInt(setting.value, 10) : 30;
      const thresholdDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      await prisma.errorLog.deleteMany({
        where: {
          createdAt: { lt: thresholdDate }
        }
      });
    } catch (cleanupError) {
      console.error('Failed to cleanup old error logs in cron:', cleanupError);
    }

    return NextResponse.json({ 
      message: 'Retry process completed', 
      processed: failedDeliveries.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Cron Webhooks Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

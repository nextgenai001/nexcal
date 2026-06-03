/**
 * NexCal — Outbound Webhooks for Automation (e.g. n8n)
 *
 * Dispatches non-blocking POST requests to process.env.N8N_WEBHOOK_URL
 * on key booking events (created, confirmed, cancelled, rescheduled).
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function triggerWebhook(event: string, payload: any): void {
  if (!N8N_WEBHOOK_URL) return;

  // Fire-and-forget: execute asynchronously without blocking the main request thread
  (async () => {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          ...payload,
        }),
        signal: AbortSignal.timeout(5000), // 5s timeout guard
      });

      if (!response.ok) {
        console.warn(
          `[Webhook] Failed to send event ${event}: ${response.status} ${response.statusText}`
        );
      }
    } catch (err) {
      console.warn(
        `[Webhook] Failed to send event ${event} (non-blocking):`,
        err instanceof Error ? err.message : err
      );
    }
  })();
}

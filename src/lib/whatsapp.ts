/**
 * ============================================================
 * NexCal — WhatsApp Notification via MultiWA
 * ============================================================
 * Non-blocking WhatsApp messaging via the MultiWA API Gateway.
 * Config priority: Organization DB settings → env vars fallback.
 * All functions are fire-and-forget: they will NEVER throw or
 * block the main booking flow, even if MultiWA is unreachable.
 * ============================================================
 */

import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n/server";

// ============================================================
// Config — DB first, env fallback
// ============================================================

const ENV_MULTIWA_API_URL = process.env.MULTIWA_API_URL || "";
const ENV_MULTIWA_API_KEY = process.env.MULTIWA_API_KEY || "";
const ENV_MULTIWA_SESSION_ID = process.env.MULTIWA_SESSION_ID || "";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "NexCal";

interface WhatsAppConfig {
  apiUrl: string;
  apiKey: string;
  sessionId: string;
}

/**
 * Get WhatsApp config for a given organization.
 * Priority: DB settings → env fallback.
 */
async function getConfig(organizationId?: string | null): Promise<WhatsAppConfig> {
  if (organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { multiwaUrl: true, multiwaApiKey: true, multiwaSessionId: true },
      });
      if (org?.multiwaUrl && org?.multiwaApiKey && org?.multiwaSessionId) {
        return {
          apiUrl: org.multiwaUrl,
          apiKey: org.multiwaApiKey,
          sessionId: org.multiwaSessionId,
        };
      }
    } catch {
      // Fall through to env
    }
  }
  return {
    apiUrl: ENV_MULTIWA_API_URL,
    apiKey: ENV_MULTIWA_API_KEY,
    sessionId: ENV_MULTIWA_SESSION_ID,
  };
}

// ============================================================
// Core: sendWhatsApp — fire-and-forget HTTP POST
// ============================================================

async function sendWhatsApp(phone: string, message: string, config: WhatsAppConfig): Promise<void> {
  if (!config.apiUrl || !config.apiKey || !config.sessionId) return;

  try {
    const normalizedPhone = normalizePhone(phone);
    const url = `${config.apiUrl}/api/sessions/${config.sessionId}/messages/send`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
      },
      body: JSON.stringify({
        to: normalizedPhone,
        text: message,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(
        `[WhatsApp] Failed to send message to ${normalizedPhone}: ${response.status} ${response.statusText}`
      );
    }
  } catch (err) {
    console.warn(`[WhatsApp] Send failed (non-blocking):`, err instanceof Error ? err.message : err);
  }
}

// ============================================================
// Phone number normalization (Indonesian format)
// ============================================================

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  if (cleaned.startsWith("08")) {
    cleaned = "62" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

// ============================================================
// Message Templates
// ============================================================

interface BookingInfo {
  patientName: string;
  patientPhone: string;
  serviceName: string;
  date: Date;
  startTime: string;
  duration: number;
  clinicName?: string;
  organizationId?: string | null;
  manageUrl?: string;
}

function formatDate(date: Date, locale: string): string {
  return format(date, "EEEE, d MMMM yyyy", { locale: locale === "id" ? idLocale : enUS });
}

// ============================================================
// Public API — Fire-and-Forget Notification Senders
// ============================================================

export function notifyBookingReceived(info: BookingInfo): void {
  (async () => {
    try {
      const locale = await getLocale();
      const dict = await getDictionary(locale);
      const config = await getConfig(info.organizationId);

      const clinic = info.clinicName || APP_NAME;
      const dateStr = formatDate(info.date, locale);

      let text = dict.notifications.receivedBody || "";
      text = text
        .replace(/{patientName}/g, info.patientName)
        .replace(/{serviceName}/g, info.serviceName)
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, info.startTime)
        .replace(/{duration}/g, String(info.duration));

      const title = dict.notifications.receivedTitle || "Booking Received";
      let message = `✅ *${title}*\n\n${text}`;
      
      if (info.manageUrl) {
        const manageLabel = locale === "id" ? "Kelola Booking" : "Manage Booking";
        message += `\n\n🔗 *${manageLabel}:* ${info.manageUrl}`;
      }
      
      const thanksLabel = locale === "id" ? "Terima kasih! 🙏" : "Thank you! 🙏";
      message += `\n\n${thanksLabel}\n— ${clinic}`;

      sendWhatsApp(info.patientPhone, message, config).catch(() => {});
    } catch (err) {
      console.warn("[WhatsApp] notifyBookingReceived failed:", err);
    }
  })();
}

export function notifyBookingConfirmed(info: BookingInfo): void {
  (async () => {
    try {
      const locale = await getLocale();
      const dict = await getDictionary(locale);
      const config = await getConfig(info.organizationId);

      const clinic = info.clinicName || APP_NAME;
      const dateStr = formatDate(info.date, locale);

      let text = dict.notifications.confirmedBody || "";
      text = text
        .replace(/{patientName}/g, info.patientName)
        .replace(/{serviceName}/g, info.serviceName)
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, info.startTime)
        .replace(/{duration}/g, String(info.duration));

      const title = dict.notifications.confirmedTitle || "Booking Confirmed! 🎉";
      let message = `🎉 *${title}*\n\n${text}`;
      
      if (info.manageUrl) {
        const manageLabel = locale === "id" ? "Kelola Booking" : "Manage Booking";
        message += `\n\n🔗 *${manageLabel}:* ${info.manageUrl}`;
      }
      
      const seeYouLabel = locale === "id" ? "Sampai jumpa! 👋" : "See you! 👋";
      message += `\n\n${seeYouLabel}\n— ${clinic}`;

      sendWhatsApp(info.patientPhone, message, config).catch(() => {});
    } catch (err) {
      console.warn("[WhatsApp] notifyBookingConfirmed failed:", err);
    }
  })();
}

export function notifyBookingCancelled(info: BookingInfo, reason?: string | null): void {
  (async () => {
    try {
      const locale = await getLocale();
      const dict = await getDictionary(locale);
      const config = await getConfig(info.organizationId);

      const clinic = info.clinicName || APP_NAME;
      const dateStr = formatDate(info.date, locale);

      let text = dict.notifications.cancelledBody || "";
      const reasonText = reason ? (locale === "id" ? `📝 *Alasan:* ${reason}\n\n` : `📝 *Reason:* ${reason}\n\n`) : "";
      
      text = text
        .replace(/{patientName}/g, info.patientName)
        .replace(/{serviceName}/g, info.serviceName)
        .replace(/{date}/g, dateStr)
        .replace(/{time}/g, info.startTime)
        .replace(/{reasonText}/g, reasonText);

      const title = dict.notifications.cancelledTitle || "Booking Cancelled";
      let message = `❌ *${title}*\n\n${text}`;
      
      const sorryLabel = locale === "id" ? "Mohon maaf. 🙏" : "We apologize. 🙏";
      message += `\n\n${sorryLabel}\n— ${clinic}`;

      sendWhatsApp(info.patientPhone, message, config).catch(() => {});
    } catch (err) {
      console.warn("[WhatsApp] notifyBookingCancelled failed:", err);
    }
  })();
}

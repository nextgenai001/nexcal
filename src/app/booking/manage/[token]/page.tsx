import { notFound } from "next/navigation";
import { getBookingByToken, type ManagedBooking } from "@/actions/booking-manage";
import { format } from "date-fns";
import { id as localeId, enUS } from "date-fns/locale";
import PatientPortalClient from "./client";
import { getTranslator } from "@/lib/i18n/server";

// Force dynamic rendering (token is unique per request)
export const dynamic = "force-dynamic";

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function canModifyBooking(booking: ManagedBooking, t: (key: string, params?: Record<string, string | number>) => string): {
  canCancel: boolean;
  canReschedule: boolean;
  reason?: string;
} {
  const isActive = ["PENDING", "CONFIRMED"].includes(booking.status);
  if (!isActive) {
    return { canCancel: false, canReschedule: false, reason: t("portal.inactiveBooking") };
  }
  const now = new Date();
  const hoursUntilStart = (new Date(booking.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilStart < 24) {
    return {
      canCancel: false,
      canReschedule: false,
      reason: t("portal.warning24h"),
    };
  }
  const canReschedule = booking.rescheduleCount < 1;
  return {
    canCancel: true,
    canReschedule,
    reason: canReschedule ? undefined : `${t("portal.rescheduleLimitLine1")} ${t("portal.rescheduleLimitLine2")}`,
  };
}

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) notFound();

  const { t, locale } = await getTranslator();

  const modification = canModifyBooking(booking, t);

  const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
    PENDING: { label: t("portal.statusPending"), color: "amber", icon: "⏳" },
    CONFIRMED: { label: t("portal.statusConfirmed"), color: "green", icon: "✅" },
    COMPLETED: { label: t("portal.statusCompleted"), color: "blue", icon: "🎉" },
    CANCELLED: { label: t("portal.statusCancelled"), color: "red", icon: "❌" },
    NO_SHOW: { label: t("portal.statusNoShow"), color: "gray", icon: "👻" },
  };

  const status = statusLabels[booking.status] || statusLabels.PENDING;

  const paymentLabels: Record<string, string> = {
    PAID: t("portal.paymentPaid"),
    UNPAID: t("portal.paymentUnpaid"),
    REFUNDED: t("portal.paymentRefunded"),
    FAILED: t("portal.paymentFailed"),
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">
            {booking.user.clinicName || "NexCal"}
          </h1>
          <p className="text-xs text-slate-500">{t("portal.patientPortalSubtitle")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {/* Status Badge */}
        <div className={`rounded-2xl border p-4 ${
          status.color === "green"
            ? "border-green-200 bg-green-50"
            : status.color === "amber"
            ? "border-amber-200 bg-amber-50"
            : status.color === "red"
            ? "border-red-200 bg-red-50"
            : status.color === "blue"
            ? "border-blue-200 bg-blue-50"
            : "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{status.icon}</span>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("portal.bookingStatus")}</p>
              <p className="text-lg font-bold text-slate-900">{status.label}</p>
            </div>
          </div>
          {booking.cancelReason && (
            <p className="mt-2 text-sm text-red-600">
              {t("portal.cancelReasonLabel", { reason: booking.cancelReason })}
            </p>
          )}
        </div>

        {/* Booking Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t("portal.bookingDetails")}
          </h2>

          <div className="space-y-3">
            <DetailRow
              label={t("common.service")}
              value={booking.serviceType.name}
              badge={booking.serviceType.isVirtual ? t("portal.onlineBadge") : undefined}
            />
            <DetailRow
              label={t("common.date")}
              value={format(new Date(booking.date), "EEEE, d MMMM yyyy", { locale: locale === "id" ? localeId : enUS })}
            />
            <DetailRow
              label={t("common.time")}
              value={`${format(new Date(booking.startTime), "HH:mm")} — ${format(new Date(booking.endTime), "HH:mm")} (${t("portal.minutesCount", { count: booking.serviceType.duration })})`}
            />
            <DetailRow label={t("common.provider")} value={booking.user.name} />
            <DetailRow label={t("common.patient")} value={booking.patientName} />
            {booking.patientNotes && (
              <DetailRow label={t("common.notes")} value={booking.patientNotes} />
            )}
          </div>
        </div>

        {/* Payment Receipt */}
        {booking.totalPrice > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {t("portal.paymentInfo")}
            </h2>
            <div className="space-y-3">
              <DetailRow
                label={t("portal.total")}
                value={formatCurrency(booking.totalPrice, locale)}
              />
              {booking.dpAmount > 0 && booking.dpAmount < booking.totalPrice && (
                <DetailRow
                  label={t("portal.dpPaid")}
                  value={formatCurrency(booking.dpAmount, locale)}
                />
              )}
              <DetailRow
                label={t("portal.paymentStatusLabel")}
                value={paymentLabels[booking.paymentStatus] || booking.paymentStatus}
              />
            </div>

            {/* Payment CTA for UNPAID bookings */}
            {booking.paymentStatus === "UNPAID" && booking.paymentUrl ? (
              <a
                href={booking.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                {t("portal.payNow", { amount: formatCurrency(booking.totalPrice, locale) })}
              </a>
            ) : booking.paymentStatus === "UNPAID" && !booking.paymentUrl ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-xs text-red-700">
                  ⚠️ {t("portal.paymentLinkError")}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Google Meet Link */}
        {booking.meetingUrl ? (
          <a
            href={booking.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
          >
            <span className="text-2xl">🎥</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">{t("portal.googleMeetLink")}</p>
              <p className="text-xs text-blue-600">{t("portal.joinOnlineConsultation")}</p>
            </div>
          </a>
        ) : booking.serviceType.isVirtual && ["PENDING", "CONFIRMED"].includes(booking.status) ? (
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <span className="text-2xl">💻</span>
            <div>
              <p className="text-sm font-semibold text-indigo-900">{t("portal.googleMeetAwaiting")}</p>
              <p className="text-xs text-indigo-600">
                {t("portal.googleMeetAwaitingNotes")}
              </p>
            </div>
          </div>
        ) : null}

        {/* Action Buttons (Client Component) */}
        <PatientPortalClient
          token={token}
          canCancel={modification.canCancel}
          canReschedule={modification.canReschedule}
          reason={modification.reason}
          bookingStatus={booking.status}
          rescheduleCount={booking.rescheduleCount}
        />

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-slate-400">
            ID: {booking.id.slice(0, 8)}… · {t("portal.createdDate", { date: format(new Date(booking.createdAt), "d MMM yyyy HH:mm", { locale: locale === "id" ? localeId : enUS }) })}
          </p>
          {booking.user.phone && (
            <p className="mt-1 text-xs text-slate-400">
              {t("portal.contactAdmin", { phone: booking.user.phone })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">
        {value}
        {badge && (
          <span className="ml-1.5 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
            {badge}
          </span>
        )}
      </span>
    </div>
  );
}

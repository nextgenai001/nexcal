import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGCalStatus } from "@/actions/gcal";
import { getOrgSettings } from "@/actions/settings";
import { GCalCard } from "@/components/admin/gcal-card";
import { MultiwaSettingsForm, GcalSettingsForm, MidtransSettingsForm } from "@/components/admin/settings-forms";
import { getTranslator } from "@/lib/i18n/server";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ gcal?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const isOwner = session.user.role === "OWNER";

  // Fetch org settings (OWNER only) + GCal OAuth status (ALL roles)
  const [orgSettings, gcalStatus, { t }] = await Promise.all([
    isOwner ? getOrgSettings() : null,
    getGCalStatus(),
    getTranslator(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("admin.settings.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("admin.settings.subtitle")}
        </p>
      </div>

      {/* Flash messages from OAuth flow */}
      {params.gcal === "connected" && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
          ✅ {t("admin.settings.gcalConnected")}
        </div>
      )}
      {params.gcal === "denied" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300">
          ⚠️ {t("admin.settings.gcalDenied")}
        </div>
      )}
      {params.gcal === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          ❌ {t("admin.settings.gcalError")}
        </div>
      )}

      {/* ========================================================== */}
      {/* Section 1: Kalender Pribadi (ALL ROLES — Owner & Staff) */}
      {/* ========================================================== */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {t("admin.settings.personalCalendar")}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t("admin.settings.personalCalendarSubtitle")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <GCalCard connected={gcalStatus.connected} configured={gcalStatus.configured} />
        </div>
      </div>

      {/* ========================================================== */}
      {/* Section 2: Integrasi Organisasi (OWNER ONLY) */}
      {/* ========================================================== */}
      {isOwner && orgSettings && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {t("admin.settings.orgIntegrations")}
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {t("admin.settings.orgIntegrationsSubtitle")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MultiwaSettingsForm data={{
              multiwaUrl: orgSettings.multiwaUrl,
              multiwaApiKey: orgSettings.multiwaApiKey,
              multiwaSessionId: orgSettings.multiwaSessionId,
            }} />
            <GcalSettingsForm data={{
              gcalClientId: orgSettings.gcalClientId,
              gcalClientSecret: orgSettings.gcalClientSecret,
            }} />
            <MidtransSettingsForm data={{
              midtransServerKey: orgSettings.midtransServerKey,
              midtransClientKey: orgSettings.midtransClientKey,
              midtransIsProd: orgSettings.midtransIsProd,
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import {
  updateTenantAction,
  resetTenantPasswordAction,
  toggleTenantActiveAction,
  type ActionResult,
} from "@/actions/admin-users";
import { format } from "date-fns";
import Link from "next/link";

import TimezoneCombobox from "@/components/ui/TimezoneCombobox";

// ── Types ────────────────────────────────────────────────────────────────────

interface ErrorLogItem {
  id: string;
  message: string;
  stack: string | null;
  path: string | null;
  component: string;
  metadata: any;
  createdAt: string;
}

interface TenantData {
  id: string;
  name: string;
  username: string;
  email: string;
  businessName: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  bookingCount: number;
  eventTypeCount: number;
  lastBookingAt: string | null;
  embedViews: number;
  errorLogs: ErrorLogItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function AlertBanner({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
        type === "error"
          ? "border-red-500/30 bg-red-500/10 text-red-400"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      }`}
    >
      {type === "error" ? (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
      {message}
    </div>
  );
}

function TenantErrorCard({ log }: { log: ErrorLogItem }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase
              ${log.component === 'CLIENT' ? 'bg-sky-500/10 text-sky-400' : ''}
              ${log.component === 'SERVER' ? 'bg-rose-500/10 text-rose-400' : ''}
              ${log.component === 'API' ? 'bg-amber-500/10 text-amber-400' : ''}
            `}>
              {log.component}
            </span>
            {log.path && (
              <code className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{log.path}</code>
            )}
          </div>
          <p className="text-xs text-slate-300 font-medium mt-1.5 line-clamp-2">{log.message}</p>
        </div>
        <time className="shrink-0 text-[10px] text-slate-600">
          {format(new Date(log.createdAt), "MMM d, HH:mm")}
        </time>
      </div>

      {(log.stack || Object.keys(log.metadata || {}).length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-semibold text-slate-500 hover:text-slate-300"
          >
            {expanded ? "Hide Details" : "View Details"}
          </button>
          
          {expanded && (
            <div className="mt-2 space-y-2 border-t border-slate-800/80 pt-2">
              {log.stack && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Stack Trace:</p>
                  <pre className="max-h-40 overflow-y-auto overflow-x-auto rounded bg-slate-950 p-2 font-mono text-[10px] text-red-300 leading-normal scrollbar-thin">
                    <code>{log.stack}</code>
                  </pre>
                </div>
              )}
              {Object.keys(log.metadata || {}).length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Metadata:</p>
                  <pre className="overflow-x-auto rounded bg-slate-950 p-2 font-mono text-[10px] text-slate-400">
                    <code>{JSON.stringify(log.metadata, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EditTenantClient({ tenant }: { tenant: TenantData }) {
  // ─ Profile update ──────────────────────────────────────────────────────────
  const updateAction = updateTenantAction.bind(null, tenant.id);
  const [updateState, updateFormAction, isUpdating] = useActionState<ActionResult | null, FormData>(
    updateAction,
    null
  );

  // ─ Password reset ──────────────────────────────────────────────────────────
  const resetPasswordBound = resetTenantPasswordAction.bind(null, tenant.id);
  const [pwState, pwFormAction, isPwPending] = useActionState<ActionResult | null, FormData>(
    resetPasswordBound,
    null
  );

  // ─ Toggle active ───────────────────────────────────────────────────────────
  const [isActive, setIsActive] = useState(tenant.isActive);
  const [togglePending, setTogglePending] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleToggle() {
    setTogglePending(true);
    setToggleError(null);
    const result = await toggleTenantActiveAction(tenant.id);
    if (result.error) {
      setToggleError(result.error);
    } else if (result.data) {
      setIsActive(result.data.isActive);
    }
    setTogglePending(false);
  }

  return (
    <div className="space-y-5">
      {/* ── Profile edit ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Profile</h2>

        {updateState?.error && <AlertBanner type="error" message={updateState.error} />}
        {updateState && !updateState.error && (
          <AlertBanner type="success" message="Profile updated successfully." />
        )}

        <form action={updateFormAction} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-400">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={tenant.name}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-400">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={tenant.email}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-xs font-medium text-slate-400">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              defaultValue={tenant.businessName ?? ""}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-xs font-medium text-slate-400 mb-1.5">
              Timezone <span className="text-red-400">*</span>
            </label>
            <TimezoneCombobox
              name="timezone"
              defaultValue={tenant.timezone}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* ── Reset Password ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-1 text-sm font-semibold text-white">Reset Password</h2>
        <p className="mb-4 text-xs text-slate-500">
          Set a new password for this tenant. They will need to use it on next login.
        </p>

        {pwState?.error && <AlertBanner type="error" message={pwState.error} />}
        {pwState && !pwState.error && (
          <AlertBanner type="success" message="Password updated successfully." />
        )}

        <form action={pwFormAction} className="mt-4 flex gap-3">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="New password (min. 8 chars)"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
          <button
            type="submit"
            disabled={isPwPending}
            className="shrink-0 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-60"
          >
            {isPwPending ? "Updating…" : "Reset"}
          </button>
        </form>
      </div>

      {/* ── Errors Logged ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Errors Logged ({tenant.errorLogs.length})</h2>
            <p className="text-xs text-slate-500">Most recent exceptions caught for this tenant</p>
          </div>
          <Link href="/admin/errors" className="text-xs text-indigo-400 hover:text-indigo-300">
            View All →
          </Link>
        </div>

        {tenant.errorLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No errors logged for this tenant.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
            {tenant.errorLogs.map((log) => (
              <TenantErrorCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-500/20 bg-slate-900 p-5">
        <h2 className="mb-1 text-sm font-semibold text-red-400">Danger Zone</h2>
        <p className="mb-4 text-xs text-slate-500">
          {isActive
            ? "Deactivating this tenant will prevent them from logging in. Their data is preserved."
            : "Reactivating will allow this tenant to log in again."}
        </p>

        {toggleError && <AlertBanner type="error" message={toggleError} />}

        <button
          onClick={handleToggle}
          disabled={togglePending}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
            isActive
              ? "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          }`}
        >
          {togglePending ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              Updating…
            </>
          ) : isActive ? (
            "Deactivate Tenant"
          ) : (
            "Reactivate Tenant"
          )}
        </button>

        {/* Meta info */}
        <p className="mt-4 text-[11px] text-slate-600">
          Created: {format(new Date(tenant.createdAt), "PPP")} · Username: @{tenant.username}
        </p>
      </div>
    </div>
  );
}

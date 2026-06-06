"use client";

import { useActionState, useState } from "react";
import {
  updateTenantAction,
  resetTenantPasswordAction,
  toggleTenantActiveAction,
  type ActionResult,
} from "@/actions/admin-users";
import { format } from "date-fns";

import TimezoneCombobox from "@/components/ui/TimezoneCombobox";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export default function EditTenantClient({ tenant }: { tenant: TenantData }) {
  // ─ Profile update ──────────────────────────────────────────────────────────
  const updateAction = updateTenantAction.bind(null, tenant.id);
  const [updateState, updateFormAction, isUpdating] = useActionState<ActionResult, FormData>(
    updateAction,
    {}
  );

  // ─ Password reset ──────────────────────────────────────────────────────────
  const resetPasswordBound = resetTenantPasswordAction.bind(null, tenant.id);
  const [pwState, pwFormAction, isPwPending] = useActionState<ActionResult, FormData>(
    resetPasswordBound,
    {}
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

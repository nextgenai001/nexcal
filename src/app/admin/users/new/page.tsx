"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTenantAction } from "@/actions/admin-users";
import Link from "next/link";
import { useEffect } from "react";

import TimezoneCombobox from "@/components/ui/TimezoneCombobox";
import { type ActionResult } from "@/actions/admin-users";

type FormState = ActionResult<{ userId: string }> | null;

// ── Component ────────────────────────────────────────────────────────────────

export default function NewTenantPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createTenantAction,
    null
  );

  // Redirect on success
  useEffect(() => {
    if (state?.data?.userId) {
      router.push(`/admin/users/${state.data.userId}`);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Create Tenant</h1>
          <p className="text-sm text-slate-400">Add a new business to the platform</p>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {state?.error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form ref={formRef} action={formAction} className="space-y-5">
        {/* Card: Basic Info */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Basic Information</h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-400">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                placeholder="John Doe"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-slate-400">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">@</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={2}
                  maxLength={32}
                  pattern="[a-z0-9-]+"
                  placeholder="john-doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-8 pr-3.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Lowercase letters, numbers, and hyphens only. This becomes their public URL: /username
              </p>
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-xs font-medium text-slate-400">
                Business Name <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Acme Corp"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        {/* Card: Account Credentials */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Account Credentials</h2>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="john@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400">
                Initial Password <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
          </div>
        </div>

        {/* Card: Timezone */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Scheduling & Locale</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="timezone" className="block text-xs font-medium text-slate-400 mb-1.5">
                Timezone <span className="text-red-400">*</span>
              </label>
              <TimezoneCombobox
                name="timezone"
                defaultValue="UTC"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="weekStart" className="block text-xs font-medium text-slate-400">
                  Start Day of the Week <span className="text-red-400">*</span>
                </label>
                <select
                  id="weekStart"
                  name="weekStart"
                  defaultValue="1"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="1">Monday (Recommended)</option>
                  <option value="0">Sunday</option>
                </select>
              </div>

              <div>
                <label htmlFor="dateFormat" className="block text-xs font-medium text-slate-400">
                  Date Format <span className="text-red-400">*</span>
                </label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  defaultValue="MM/dd/yyyy"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="MM/dd/yyyy">MM/DD/YYYY (e.g. 12/25/2026)</option>
                  <option value="dd/MM/yyyy">DD/MM/YYYY (e.g. 25/12/2026)</option>
                  <option value="yyyy-MM-dd">YYYY-MM-DD (e.g. 2026-12-25)</option>
                  <option value="MM/dd/yy">MM/DD/YY (e.g. 12/25/26)</option>
                  <option value="dd/MM/yy">DD/MM/YY (e.g. 25/12/26)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
          >
            {isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Tenant
              </>
            )}
          </button>
          <Link
            href="/admin/users"
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

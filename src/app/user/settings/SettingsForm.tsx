"use client";

import { useActionState } from "react";
import { updateTenantProfileAction } from "@/actions/tenant-settings";

export default function SettingsForm({ user }: { user: any }) {
  const [state, formAction, isPending] = useActionState(updateTenantProfileAction, { success: false, error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
          Settings updated successfully.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300">Business Name</label>
        <input
          type="text"
          name="businessName"
          defaultValue={user.businessName || ""}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300">Timezone</label>
        <select
          name="timezone"
          defaultValue={user.timezone}
          required
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {/* Simplified list of timezones for this task */}
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time (US & Canada)</option>
          <option value="America/Chicago">Central Time (US & Canada)</option>
          <option value="America/Denver">Mountain Time (US & Canada)</option>
          <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
          <option value="Asia/Jakarta">Jakarta</option>
          <option value="Australia/Sydney">Sydney</option>
        </select>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

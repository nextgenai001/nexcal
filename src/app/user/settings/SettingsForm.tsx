"use client";

import { useActionState } from "react";
import { updateTenantProfileAction } from "@/actions/tenant-settings";
import TimezoneCombobox from "@/components/ui/TimezoneCombobox";

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
          defaultValue={user.businessName || user.name || ""}
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Timezone</label>
        <TimezoneCombobox
          name="timezone"
          defaultValue={user.timezone}
          required
        />
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

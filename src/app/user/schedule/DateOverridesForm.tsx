"use client";

import { useActionState, useTransition } from "react";
import { addDateOverrideAction, deleteDateOverrideAction } from "@/actions/schedule-actions";
import { format } from "date-fns";

export default function DateOverridesForm({ overrides }: { overrides: any[] }) {
  const [state, formAction, isPending] = useActionState(addDateOverrideAction, { success: false, error: null });
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(() => {
      deleteDateOverrideAction(id);
    });
  };

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {state.error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-300">Date</label>
          <input
            type="date"
            name="date"
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Type</label>
          <select
            name="isBlocked"
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="true">Unavailable (Blocked)</option>
            <option value="false">Specific Hours</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Start Time</label>
            <input
              type="time"
              name="startTime"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">End Time</label>
            <input
              type="time"
              name="endTime"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        
        <p className="text-xs text-slate-500">Note: Times are only used if 'Specific Hours' is selected.</p>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add Override"}
        </button>
      </form>

      <div className="pt-6 border-t border-slate-800 space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Upcoming Overrides</h3>
        {overrides.length === 0 ? (
          <p className="text-sm text-slate-500">No date overrides set.</p>
        ) : (
          overrides.map(override => (
            <div key={override.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-white">{format(new Date(override.date), "MMM d, yyyy")}</p>
                <p className="text-xs text-slate-400">
                  {override.isBlocked ? "Unavailable" : `${override.startTime} - ${override.endTime}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(override.id)}
                disabled={isDeleting}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

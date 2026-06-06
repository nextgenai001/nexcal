"use client";

import { useActionState, useState } from "react";
import { updateScheduleAction } from "@/actions/schedule-actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ScheduleForm({ schedules }: { schedules: any[] }) {
  const [days, setDays] = useState(() => {
    return DAYS.map((name, index) => {
      const existing = schedules.find((s) => s.dayOfWeek === index);
      return {
        dayOfWeek: index,
        name,
        isActive: !!existing,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
      };
    });
  });

  const updateDay = (index: number, key: string, value: any) => {
    setDays(days.map((d, i) => i === index ? { ...d, [key]: value } : d));
  };

  const [state, formAction, isPending] = useActionState(updateScheduleAction, { success: false, error: null });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
          Schedule updated successfully.
        </div>
      )}

      <input type="hidden" name="schedules" value={JSON.stringify(days)} />

      <div className="space-y-4">
        {days.map((day, i) => (
          <div key={day.dayOfWeek} className="flex items-center gap-4">
            <div className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                checked={day.isActive}
                onChange={(e) => updateDay(i, "isActive", e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span className={`text-sm ${day.isActive ? 'text-white' : 'text-slate-500'}`}>
                {day.name}
              </span>
            </div>
            
            {day.isActive ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateDay(i, "startTime", e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateDay(i, "endTime", e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : (
              <div className="flex-1 text-sm text-slate-500">Unavailable</div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
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

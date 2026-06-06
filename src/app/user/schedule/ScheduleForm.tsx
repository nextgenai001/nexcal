// src/app/user/schedule/ScheduleForm.tsx
"use client";

import { useActionState, useState } from "react";
import { updateScheduleAction } from "@/actions/schedule-actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Range {
  startTime: string;
  endTime: string;
}

interface DayState {
  dayOfWeek: number;
  name: string;
  isActive: boolean;
  ranges: Range[];
}

export default function ScheduleForm({
  schedules,
  globalBreaks = [],
}: {
  schedules: any[];
  globalBreaks: any[];
}) {
  // Initialize availability days and ranges
  const [days, setDays] = useState<DayState[]>(() => {
    return DAYS.map((name, index) => {
      const daySchedules = schedules.filter((s) => s.dayOfWeek === index);
      return {
        dayOfWeek: index,
        name,
        isActive: daySchedules.length > 0,
        ranges: daySchedules.length > 0
          ? daySchedules.map((ds) => ({ startTime: ds.startTime, endTime: ds.endTime }))
          : [{ startTime: "09:00", endTime: "17:00" }],
      };
    });
  });

  // Initialize global breaks
  const [breaks, setBreaks] = useState<Range[]>(() => {
    return Array.isArray(globalBreaks)
      ? globalBreaks.map((b: any) => ({
          startTime: b.startTime || "12:00",
          endTime: b.endTime || "13:00",
        }))
      : [];
  });

  const toggleDayActive = (index: number, isActive: boolean) => {
    setDays(days.map((d, i) => (i === index ? { ...d, isActive } : d)));
  };

  const addRange = (dayIndex: number) => {
    setDays(
      days.map((d, i) => {
        if (i === dayIndex) {
          return {
            ...d,
            isActive: true,
            ranges: [...d.ranges, { startTime: "13:00", endTime: "17:00" }],
          };
        }
        return d;
      })
    );
  };

  const removeRange = (dayIndex: number, rangeIndex: number) => {
    setDays(
      days.map((d, i) => {
        if (i === dayIndex) {
          const newRanges = d.ranges.filter((_, rIdx) => rIdx !== rangeIndex);
          return {
            ...d,
            ranges: newRanges.length > 0 ? newRanges : [{ startTime: "09:00", endTime: "17:00" }],
            isActive: newRanges.length > 0 ? d.isActive : false,
          };
        }
        return d;
      })
    );
  };

  const updateRangeValue = (
    dayIndex: number,
    rangeIndex: number,
    key: keyof Range,
    value: string
  ) => {
    setDays(
      days.map((d, i) => {
        if (i === dayIndex) {
          return {
            ...d,
            ranges: d.ranges.map((r, rIdx) =>
              rIdx === rangeIndex ? { ...r, [key]: value } : r
            ),
          };
        }
        return d;
      })
    );
  };

  const addGlobalBreak = () => {
    setBreaks([...breaks, { startTime: "12:00", endTime: "13:00" }]);
  };

  const removeGlobalBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const updateBreakValue = (index: number, key: keyof Range, value: string) => {
    setBreaks(breaks.map((b, i) => (i === index ? { ...b, [key]: value } : b)));
  };

  const [state, formAction, isPending] = useActionState(updateScheduleAction, {
    success: false,
    error: null,
  });

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          Schedule updated successfully.
        </div>
      )}

      {/* Hidden Fields for action serialization */}
      <input type="hidden" name="schedules" value={JSON.stringify(days)} />
      <input type="hidden" name="globalBreaks" value={JSON.stringify(breaks)} />

      {/* ── Daily availability list ── */}
      <div className="space-y-5 divide-y divide-slate-800">
        {days.map((day, i) => (
          <div key={day.dayOfWeek} className="flex flex-col md:flex-row md:items-start gap-4 pt-5 first:pt-0">
            {/* Toggle + Name */}
            <div className="flex w-44 shrink-0 items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id={`day-active-${day.dayOfWeek}`}
                checked={day.isActive}
                onChange={(e) => toggleDayActive(i, e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
              />
              <label
                htmlFor={`day-active-${day.dayOfWeek}`}
                className={`text-sm font-semibold select-none cursor-pointer ${
                  day.isActive ? "text-white" : "text-slate-500"
                }`}
              >
                {day.name}
              </label>
            </div>

            {/* Time Ranges */}
            <div className="flex-1 space-y-3">
              {day.isActive ? (
                <>
                  {day.ranges.map((range, rangeIndex) => (
                    <div key={rangeIndex} className="flex items-center gap-2.5 animate-in fade-in duration-200">
                      <input
                        type="time"
                        value={range.startTime}
                        required
                        onChange={(e) =>
                          updateRangeValue(i, rangeIndex, "startTime", e.target.value)
                        }
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                      />
                      <span className="text-slate-500 font-medium">-</span>
                      <input
                        type="time"
                        value={range.endTime}
                        required
                        onChange={(e) =>
                          updateRangeValue(i, rangeIndex, "endTime", e.target.value)
                        }
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                      />

                      {/* Delete range */}
                      <button
                        type="button"
                        onClick={() => removeRange(i, rangeIndex)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                        title="Delete slot"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add range button */}
                  <button
                    type="button"
                    onClick={() => addRange(i)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline pt-1 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add time range
                  </button>
                </>
              ) : (
                <span className="text-sm text-slate-500 py-1 block">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Global Breaks Card ── */}
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Global Breaks</h3>
            <p className="text-xs text-slate-500">Define daily periods (e.g. lunch hour) that block booking slots for all active days.</p>
          </div>
          <button
            type="button"
            onClick={addGlobalBreak}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-slate-700 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Break
          </button>
        </div>

        {breaks.length > 0 ? (
          <div className="space-y-3">
            {breaks.map((brk, index) => (
              <div key={index} className="flex items-center gap-2.5 animate-in fade-in duration-200">
                <input
                  type="time"
                  value={brk.startTime}
                  required
                  onChange={(e) => updateBreakValue(index, "startTime", e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                />
                <span className="text-slate-500 font-medium">-</span>
                <input
                  type="time"
                  value={brk.endTime}
                  required
                  onChange={(e) => updateBreakValue(index, "endTime", e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                />

                {/* Delete break */}
                <button
                  type="button"
                  onClick={() => removeGlobalBreak(index)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                  title="Remove global break"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center text-xs text-slate-600">
            No global breaks configured. Available hours are continuous.
          </div>
        )}
      </div>

      <div className="flex justify-end pt-5 border-t border-slate-800">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
        >
          {isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving Changes…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}

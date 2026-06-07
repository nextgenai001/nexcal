// src/app/user/schedule/ScheduleForm.tsx
"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import { 
  updateScheduleAction, 
  createAvailabilityScheduleAction, 
  renameAvailabilityScheduleAction, 
  deleteAvailabilityScheduleAction 
} from "@/actions/schedule-actions";

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
  availabilitySchedules,
  globalBreaks = [],
}: {
  availabilitySchedules: any[];
  globalBreaks: any[];
}) {
  // Active availability schedule selection
  const [activeScheduleId, setActiveScheduleId] = useState<string>(() => {
    const def = availabilitySchedules.find((as) => as.isDefault) || availabilitySchedules[0];
    return def?.id || "";
  });

  // State for creating a new schedule
  const [isCreating, setIsCreating] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [isCreatePending, startCreateTransition] = useTransition();

  // State for renaming current schedule
  const [isEditingName, setIsEditingName] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamePending, startRenameTransition] = useTransition();

  // State for deleting current schedule
  const [isDeletePending, startDeleteTransition] = useTransition();

  // Initialize availability days and ranges based on activeScheduleId
  const [days, setDays] = useState<DayState[]>([]);

  // Initialize global breaks
  const [breaks, setBreaks] = useState<Range[]>(() => {
    return Array.isArray(globalBreaks)
      ? globalBreaks.map((b: any) => ({
          startTime: b.startTime || "12:00",
          endTime: b.endTime || "13:00",
        }))
      : [];
  });

  // Sync days state when activeScheduleId or availabilitySchedules changes
  useEffect(() => {
    const activeSchedule = availabilitySchedules.find((as) => as.id === activeScheduleId);
    const sList = activeSchedule?.schedules || [];
    setDays(
      DAYS.map((name, index) => {
        const daySchedules = sList.filter((s: any) => s.dayOfWeek === index);
        return {
          dayOfWeek: index,
          name,
          isActive: daySchedules.length > 0,
          ranges: daySchedules.length > 0
            ? daySchedules.map((ds: any) => ({ startTime: ds.startTime, endTime: ds.endTime }))
            : [{ startTime: "09:00", endTime: "17:00" }],
        };
      })
    );
    if (activeSchedule) {
      setRenameValue(activeSchedule.name);
    }
  }, [activeScheduleId, availabilitySchedules]);

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

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim() || isCreatePending) return;

    startCreateTransition(async () => {
      const formData = new FormData();
      formData.append("name", newScheduleName.trim());
      const res = await createAvailabilityScheduleAction(null, formData);
      if (res.success && res.scheduleId) {
        setNewScheduleName("");
        setIsCreating(false);
        setActiveScheduleId(res.scheduleId);
      } else {
        alert(res.error || "Failed to create schedule");
      }
    });
  };

  const handleRenameSchedule = () => {
    if (!renameValue.trim() || isRenamePending) return;
    startRenameTransition(async () => {
      const formData = new FormData();
      formData.append("scheduleId", activeScheduleId);
      formData.append("name", renameValue.trim());
      const res = await renameAvailabilityScheduleAction(null, formData);
      if (res.success) {
        setIsEditingName(false);
      } else {
        alert(res.error || "Failed to rename schedule");
      }
    });
  };

  const handleDeleteSchedule = () => {
    if (isDeletePending) return;
    if (confirm("Are you sure you want to delete this schedule? This will set any events linked to it to use your default schedule instead.")) {
      startDeleteTransition(async () => {
        const res = await deleteAvailabilityScheduleAction(activeScheduleId);
        if (res.success) {
          const def = availabilitySchedules.find((as) => as.isDefault) || availabilitySchedules[0];
          setActiveScheduleId(def?.id || "");
        } else {
          alert(res.error || "Failed to delete schedule");
        }
      });
    }
  };

  const [state, formAction, isPending] = useActionState(updateScheduleAction, {
    success: false,
    error: null,
  });

  const activeSchedule = availabilitySchedules.find((as) => as.id === activeScheduleId);

  return (
    <div className="space-y-6">
      {/* ── Schedule Selector & Administration ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule:</label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
              <button
                type="button"
                onClick={handleRenameSchedule}
                disabled={isRenamePending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {isRenamePending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingName(false);
                  if (activeSchedule) setRenameValue(activeSchedule.name);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={activeScheduleId}
                onChange={(e) => setActiveScheduleId(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              >
                {availabilitySchedules.map((as) => (
                  <option key={as.id} value={as.id}>
                    {as.name} {as.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="Rename Schedule"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </button>
              {activeSchedule && !activeSchedule.isDefault && (
                <button
                  type="button"
                  onClick={handleDeleteSchedule}
                  disabled={isDeletePending}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                  title="Delete Schedule"
                >
                  {isDeletePending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-white" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          {isCreating ? (
            <form onSubmit={handleCreateSchedule} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="New schedule name"
                value={newScheduleName}
                required
                onChange={(e) => setNewScheduleName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isCreatePending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {isCreatePending ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-slate-700 transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Schedule
            </button>
          )}
        </div>
      </div>

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
        <input type="hidden" name="scheduleId" value={activeScheduleId} />
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
    </div>
  );
}

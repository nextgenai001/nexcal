// src/app/user/schedule/ScheduleForm.tsx
"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import { 
  updateScheduleAction, 
  createAvailabilityScheduleAction, 
  renameAvailabilityScheduleAction, 
  deleteAvailabilityScheduleAction,
  setDefaultAvailabilityScheduleAction,
  addDateOverrideAction,
  deleteDateOverrideAction
} from "@/actions/schedule-actions";
import { format } from "date-fns";
import DatePicker from "@/components/ui/DatePicker";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Range {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilitySchedule {
  id: string;
  name: string;
  isDefault: boolean;
  schedules: DaySchedule[];
}

interface DateOverride {
  id: string;
  date: Date | string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason?: string | null;
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
  dateOverrides = [],
  weekStart = 1,
  dateFormat = "MM/dd/yyyy",
}: {
  availabilitySchedules: AvailabilitySchedule[];
  globalBreaks: Range[];
  dateOverrides: DateOverride[];
  weekStart?: number;
  dateFormat?: string;
}) {
  // Active availability schedule selection
  const [activeScheduleId, setActiveScheduleId] = useState<string>(() => {
    const def = availabilitySchedules.find((as) => as.isDefault) || availabilitySchedules[0];
    return def?.id || "";
  });

  // Controlled state for custom reusable DatePicker
  const [isoDateValue, setIsoDateValue] = useState("");

  // Current active tab on the right side: "hours" | "breaks" | "overrides"
  const [activeTab, setActiveTab] = useState<"hours" | "breaks" | "overrides">("hours");

  // State for creating a new schedule
  const [isCreating, setIsCreating] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [isCreatePending, startCreateTransition] = useTransition();

  // State for renaming current schedule
  const [isEditingName, setIsEditingName] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [isRenamePending, startRenameTransition] = useTransition();

  // State for deleting/default transitions
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isDefaultPending, startDefaultTransition] = useTransition();
  const [isOverridePending, startOverrideTransition] = useTransition();
  const [isDeleteOverridePending, startDeleteOverrideTransition] = useTransition();

  // Initialize availability days and ranges based on activeScheduleId
  const [days, setDays] = useState<DayState[]>([]);

  // Initialize global breaks
  const [breaks, setBreaks] = useState<Range[]>(() => {
    return Array.isArray(globalBreaks)
      ? globalBreaks.map((b: Range) => ({
          startTime: b.startTime || "12:00",
          endTime: b.endTime || "13:00",
        }))
      : [];
  });

  // Sync days state when activeScheduleId or availabilitySchedules changes
  useEffect(() => {
    const activeSchedule = availabilitySchedules.find((as) => as.id === activeScheduleId);
    const sList = activeSchedule?.schedules || [];
    
    // Construct days ordered by weekStart
    const ordered = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (weekStart + i) % 7;
      ordered.push({
        dayOfWeek: dayIndex,
        name: DAYS[dayIndex],
      });
    }

    setDays(
      ordered.map(({ dayOfWeek, name }) => {
        const daySchedules = sList.filter((s: DaySchedule) => s.dayOfWeek === dayOfWeek);
        return {
          dayOfWeek,
          name,
          isActive: daySchedules.length > 0,
          ranges: daySchedules.length > 0
            ? daySchedules.map((ds: DaySchedule) => ({ startTime: ds.startTime, endTime: ds.endTime }))
            : [{ startTime: "09:00", endTime: "17:00" }],
        };
      })
    );
    if (activeSchedule) {
      setRenameValue(activeSchedule.name);
    }
  }, [activeScheduleId, availabilitySchedules, weekStart]);

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

  const handleSetDefaultSchedule = () => {
    if (isDefaultPending) return;
    startDefaultTransition(async () => {
      const res = await setDefaultAvailabilityScheduleAction(activeScheduleId);
      if (!res.success) {
        alert(res.error || "Failed to set default schedule");
      }
    });
  };

  const handleAddOverride = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isOverridePending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    startOverrideTransition(async () => {
      const res = await addDateOverrideAction(null, formData);
      if (res.success) {
        form.reset();
        setIsoDateValue("");
      } else {
        alert(res.error || "Failed to add override");
      }
    });
  };

  const handleDeleteOverride = (id: string) => {
    if (isDeleteOverridePending) return;
    startDeleteOverrideTransition(async () => {
      const res = await deleteDateOverrideAction(id);
      if (!res.success) {
        alert(res.error || "Failed to delete override");
      }
    });
  };

  const [state, formAction, isPending] = useActionState(updateScheduleAction, {
    success: false,
    error: null,
  });

  const [localSuccess, setLocalSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Sync action state to local state
  useEffect(() => {
    setLocalSuccess(state.success);
    setLocalError(state.error);
  }, [state]);

  // Clear local state when activeScheduleId changes
  useEffect(() => {
    setLocalSuccess(false);
    setLocalError(null);
  }, [activeScheduleId]);

  const activeSchedule = availabilitySchedules.find((as) => as.id === activeScheduleId);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      {/* ── LEFT PANEL: Schedules List Sidebar ── */}
      <div className="space-y-4 lg:col-span-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Your Schedules</h2>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-500/10"
              title="Add new schedule"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          )}
        </div>

        {isCreating && (
          <form onSubmit={handleCreateSchedule} className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Schedule Name</label>
              <input
                type="text"
                placeholder="e.g. Weekend Hours"
                value={newScheduleName}
                required
                onChange={(e) => setNewScheduleName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatePending}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {isCreatePending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          {availabilitySchedules.map((as) => {
            const isSelected = as.id === activeScheduleId;
            return (
              <div
                key={as.id}
                onClick={() => {
                  if (!isSelected) {
                    setActiveScheduleId(as.id);
                    setIsEditingName(false);
                  }
                }}
                className={`group relative flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/5 shadow-md shadow-indigo-500/5"
                    : "border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex flex-col gap-1 pr-6">
                  <span className={`text-sm font-semibold transition-colors ${isSelected ? "text-white" : "text-slate-300"}`}>
                    {as.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {as.isDefault && (
                      <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Default
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium">
                      {as.schedules?.length || 0} active range{(as.schedules?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingName(true);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Rename"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    {!as.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSchedule();
                        }}
                        disabled={isDeletePending}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                        title="Delete"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL: Workspace (Tabs, Daily Hours, Breaks, Overrides) ── */}
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md shadow-xl shadow-slate-950/20">
          
          {/* Header Area */}
          <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between bg-slate-900/60">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-base font-semibold text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRenameSchedule}
                    disabled={isRenamePending}
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
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
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-bold text-white">{activeSchedule?.name || "Loading..."}</h3>
                  {activeSchedule?.isDefault ? (
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Primary
                    </span>
                  ) : (
                    <button
                      onClick={handleSetDefaultSchedule}
                      disabled={isDefaultPending}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:border-indigo-500/50 hover:text-indigo-400 transition-all"
                    >
                      {isDefaultPending ? "Setting..." : "Set as Default"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Premium Tab Selectors */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800/60">
              <button
                onClick={() => setActiveTab("hours")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "hours"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Weekly Hours
              </button>
              <button
                onClick={() => setActiveTab("breaks")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "breaks"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Global Breaks
              </button>
              <button
                onClick={() => setActiveTab("overrides")}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "overrides"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Date Overrides
              </button>
            </div>
          </div>

          {/* Form Content Wrapper */}
          <div className="p-6">
            {activeTab === "hours" && (
              <form action={formAction} className="space-y-6">
                {localError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 animate-in fade-in duration-200">
                    {localError}
                  </div>
                )}
                {localSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400 animate-in fade-in duration-200">
                    Weekly hours updated successfully.
                  </div>
                )}

                <input type="hidden" name="scheduleId" value={activeScheduleId} />
                <input type="hidden" name="schedules" value={JSON.stringify(days)} />
                <input type="hidden" name="globalBreaks" value={JSON.stringify(breaks)} />

                <div className="space-y-5 divide-y divide-slate-800/60">
                  {days.map((day, i) => (
                    <div key={day.dayOfWeek} className="flex flex-col md:flex-row md:items-start gap-4 pt-5 first:pt-0">
                      
                      {/* Day Toggle Switch */}
                      <div className="flex w-40 shrink-0 items-center gap-3 py-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={day.isActive}
                            onChange={(e) => toggleDayActive(i, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                        </label>
                        <span className={`text-sm font-semibold select-none ${day.isActive ? "text-white" : "text-slate-500"}`}>
                          {day.name}
                        </span>
                      </div>

                      {/* Time Slots Selector */}
                      <div className="flex-1 space-y-3">
                        {day.isActive ? (
                          <div className="flex flex-col gap-2.5">
                            {day.ranges.map((range, rangeIndex) => (
                              <div key={rangeIndex} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-1 duration-150">
                                <input
                                  type="time"
                                  value={range.startTime}
                                  required
                                  onChange={(e) =>
                                    updateRangeValue(i, rangeIndex, "startTime", e.target.value)
                                  }
                                  className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-slate-600 font-semibold">-</span>
                                <input
                                  type="time"
                                  value={range.endTime}
                                  required
                                  onChange={(e) =>
                                    updateRangeValue(i, rangeIndex, "endTime", e.target.value)
                                  }
                                  className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                />

                                <button
                                  type="button"
                                  onClick={() => removeRange(i, rangeIndex)}
                                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                                  title="Delete range"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addRange(i)}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 w-fit pt-0.5"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Add time slot
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic py-1 block">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  >
                    {isPending ? "Saving Changes..." : "Save Weekly Hours"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "breaks" && (
              <form action={formAction} className="space-y-6 animate-in fade-in duration-200">
                {localError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                    {localError}
                  </div>
                )}
                {localSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
                    Global breaks updated successfully.
                  </div>
                )}

                <input type="hidden" name="scheduleId" value={activeScheduleId} />
                <input type="hidden" name="schedules" value={JSON.stringify(days)} />
                <input type="hidden" name="globalBreaks" value={JSON.stringify(breaks)} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Configured Breaks</h4>
                      <p className="text-xs text-slate-500">Continuous break windows configured globally for all active days.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addGlobalBreak}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:border-slate-700 transition-all"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Global Break
                    </button>
                  </div>

                  {breaks.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {breaks.map((brk, index) => (
                        <div key={index} className="flex items-center gap-3 animate-in fade-in duration-150">
                          <input
                            type="time"
                            value={brk.startTime}
                            required
                            onChange={(e) => updateBreakValue(index, "startTime", e.target.value)}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />
                          <span className="text-slate-600 font-semibold">-</span>
                          <input
                            type="time"
                            value={brk.endTime}
                            required
                            onChange={(e) => updateBreakValue(index, "endTime", e.target.value)}
                            className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => removeGlobalBreak(index)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
                            title="Remove break"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800 py-10 text-center text-xs text-slate-500">
                      No global breaks configured.
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-5 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                  >
                    {isPending ? "Saving Changes..." : "Save Global Breaks"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "overrides" && (
              <div className="space-y-8 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  
                  {/* Override Form */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
                    <h4 className="text-sm font-bold text-white">Add Date Override</h4>
                    
                    <form onSubmit={handleAddOverride} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400">Select Date</label>
                        <DatePicker
                          name="date"
                          value={isoDateValue}
                          onChange={setIsoDateValue}
                          dateFormat={dateFormat}
                          weekStart={weekStart}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400">Override Mode</label>
                        <select
                          name="isBlocked"
                          className="mt-1 block w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="true">Unavailable / Blocked All Day</option>
                          <option value="false">Specific Availability Hours</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-400">Start Time</label>
                          <input
                            type="time"
                            name="startTime"
                            className="mt-1 block w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400">End Time</label>
                          <input
                            type="time"
                            name="endTime"
                            className="mt-1 block w-full rounded-lg border border-slate-850 bg-slate-950 p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isOverridePending}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/10"
                      >
                        {isOverridePending ? "Adding..." : "Add Override"}
                      </button>
                    </form>
                  </div>

                  {/* Overrides list */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Active Overrides</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {dateOverrides.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-xs text-slate-500">
                          No date overrides set.
                        </div>
                      ) : (
                        dateOverrides.map((override) => (
                          <div
                            key={override.id}
                            className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                              override.isBlocked
                                ? "border-red-950/40 bg-red-500/5"
                                : "border-emerald-950/40 bg-emerald-500/5"
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-sm font-bold text-white">
                                {format(new Date(override.date), dateFormat)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                    override.isBlocked
                                      ? "bg-red-500/10 text-red-400"
                                      : "bg-emerald-500/10 text-emerald-400"
                                  }`}
                                >
                                  {override.isBlocked ? "Blocked" : "Custom Hours"}
                                </span>
                                {!override.isBlocked && (
                                  <span className="text-xs text-slate-400">
                                    {override.startTime} - {override.endTime}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteOverride(override.id)}
                              disabled={isDeleteOverridePending}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-all"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

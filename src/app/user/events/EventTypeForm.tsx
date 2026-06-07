"use client";

import { useActionState, useState, useEffect } from "react";
import { createEventTypeAction, updateEventTypeAction } from "@/actions/event-types";
import { useRouter } from "next/navigation";

export default function EventTypeForm({ 
  eventType,
  availabilitySchedules = []
}: { 
  eventType?: any;
  availabilitySchedules?: any[];
}) {
  const router = useRouter();
  const customFieldsData = eventType?.customFields;

  const [defaultFields, setDefaultFields] = useState(() => {
    const defaults = {
      name: { enabled: true, required: true, label: "Full Name" },
      email: { enabled: true, required: true, label: "Email Address" },
      phone: { enabled: false, required: false, label: "Phone Number" },
      guests: { enabled: false, required: false, label: "Add Guests (emails)" },
      meeting_about: { enabled: false, required: false, label: "What is this meeting about?" },
      notes: { enabled: false, required: false, label: "Additional Notes" }
    };
    if (customFieldsData && typeof customFieldsData === "object" && !Array.isArray(customFieldsData)) {
      return { ...defaults, ...customFieldsData.defaultFields };
    }
    return defaults;
  });

  const [fields, setFields] = useState<any[]>(() => {
    if (customFieldsData && typeof customFieldsData === "object" && !Array.isArray(customFieldsData)) {
      return Array.isArray(customFieldsData.customFields) ? customFieldsData.customFields : [];
    }
    if (Array.isArray(customFieldsData)) {
      return customFieldsData;
    }
    return [];
  });

  const toggleDefaultField = (key: string, field: "enabled" | "required", value: boolean) => {
    setDefaultFields((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const [slug, setSlug] = useState(eventType?.slug || "");
  const [hasDateRange, setHasDateRange] = useState(!!(eventType?.startDate || eventType?.endDate));
  const [startDate, setStartDate] = useState(() => {
    if (!eventType?.startDate) return "";
    const d = new Date(eventType.startDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (!eventType?.endDate) return "";
    const d = new Date(eventType.endDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const autoSlug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(autoSlug);
  };

  const addField = () => {
    setFields([
      ...fields,
      { id: Date.now().toString(), label: "", type: "text", required: false },
    ]);
  };

  const updateField = (id: string, key: string, value: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const action = eventType
    ? updateEventTypeAction.bind(null, eventType.id)
    : createEventTypeAction;

  const [state, formAction, isPending] = useActionState(action, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      router.push("/user/events");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={eventType?.name}
            onChange={handleNameChange}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-300">URL Slug</label>
          <div className="mt-1 flex rounded-lg border border-slate-800 bg-slate-900/30 select-none">
            <span className="inline-flex items-center rounded-l-lg border-r border-slate-800 bg-slate-900/30 px-3 text-sm text-slate-500">
              /username/
            </span>
            <input
              type="text"
              id="slug"
              name="slug"
              value={slug}
              readOnly
              required
              className="block w-full rounded-r-lg bg-transparent p-2.5 text-slate-400 cursor-not-allowed focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
          <textarea
            id="description"
            name="description"
            defaultValue={eventType?.description || ""}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-300">Duration (minutes)</label>
          <input
            type="number"
            id="duration"
            name="duration"
            defaultValue={eventType?.duration || 30}
            required
            min={1}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="availabilityScheduleId" className="block text-sm font-medium text-slate-300">Availability Schedule</label>
          <select
            id="availabilityScheduleId"
            name="availabilityScheduleId"
            defaultValue={eventType?.availabilityScheduleId || availabilitySchedules.find(as => as.isDefault)?.id || ""}
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availabilitySchedules.map((as) => (
              <option key={as.id} value={as.id}>
                {as.name} {as.isDefault ? "(Default)" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Select the availability schedule that governs when this event can be booked.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDateRange"
              name="hasDateRange"
              value="true"
              checked={hasDateRange}
              onChange={(e) => setHasDateRange(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hasDateRange" className="text-sm font-medium text-slate-300">
              Limit date range for bookings
            </label>
          </div>

          {hasDateRange && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-slate-900/30 p-4 rounded-xl border border-slate-800/80">
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required={hasDateRange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={hasDateRange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-6">
          {/* Default Fields Toggles */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-bold text-white mb-3">Default Form Fields</h3>
            <div className="space-y-3.5 divide-y divide-slate-800/60">
              {Object.entries(defaultFields).map(([key, config]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-xs py-2 first:pt-0">
                  <span className="font-semibold text-slate-300">{config.label}</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={(e) => toggleDefaultField(key, "enabled", e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-slate-400">Enabled</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.required}
                        disabled={!config.enabled}
                        onChange={(e) => toggleDefaultField(key, "required", e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30"
                      />
                      <span className={`text-xs ${config.enabled ? 'text-slate-400' : 'text-slate-600'}`}>Required</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Custom Fields</h3>
              <button
                type="button"
                onClick={addField}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                + Add Custom Field
              </button>
            </div>
            
            <input type="hidden" name="customFields" value={JSON.stringify({ defaultFields, customFields: fields })} />
          
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border border-slate-800 rounded-lg bg-slate-800/50">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, "label", e.target.value)}
                        className="block w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, "type", e.target.value)}
                        className="block w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="textarea">Textarea</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(field.id, "required", e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label className="text-sm text-slate-300">Required</label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="text-slate-500 hover:text-red-400 p-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-slate-500">No custom fields added. Default fields (Name, Email) are always included.</p>
            )}
          </div>
        </div>
      </div>
    </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Event Type"}
        </button>
      </div>
    </form>
  );
}

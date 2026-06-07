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

  // Custom widget customization states
  const [name, setName] = useState(eventType?.name || "15-Minute Consultation");
  const [duration, setDuration] = useState(eventType?.duration || 15);
  const [description, setDescription] = useState(eventType?.description || "");
  const [bookingButtonText, setBookingButtonText] = useState(customFieldsData?.bookingButtonText || "Schedule Event");
  const [themeColor, setThemeColor] = useState(customFieldsData?.themeColor || "#2563eb");
  const [borderRadius, setBorderRadius] = useState(customFieldsData?.borderRadius || "rounded");
  const [backgroundTheme, setBackgroundTheme] = useState(customFieldsData?.backgroundTheme || "light");

  // Preview options
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewStep, setPreviewStep] = useState<"date_time" | "details">("details");
  const [mockSidebarCollapsed, setMockSidebarCollapsed] = useState(false);

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
    setName(e.target.value);
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

  // Preview container dimensions
  const previewWidth = previewDevice === "mobile" ? "375px" : previewDevice === "tablet" ? "550px" : "100%";
  const previewIsDark = backgroundTheme === "dark";
  const previewIsSquare = borderRadius === "square";

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full">
      {/* LEFT COLUMN: Editing Form */}
      <div className="lg:col-span-6 space-y-6">
        {state.error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
            {state.error}
          </div>
        )}

        <div className="space-y-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Event Details</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
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
        </div>

        {/* WIDGET CUSTOMIZATION SECTION */}
        <div className="space-y-4 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-2">Widget Style & Customization</h2>
          <p className="text-xs text-slate-400 mb-4">Customize the appearance of the booking widget for this specific event type.</p>
          
          <div>
            <label htmlFor="bookingButtonText" className="block text-sm font-medium text-slate-300">Submit Button Text</label>
            <input
              type="text"
              id="bookingButtonText"
              value={bookingButtonText}
              onChange={(e) => setBookingButtonText(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Schedule Event"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Theme Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Border Style</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-1 h-[42px] items-center">
                <button
                  type="button"
                  onClick={() => setBorderRadius("rounded")}
                  className={`rounded py-1 text-xs font-medium transition-all ${
                    borderRadius === "rounded" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Rounded Corners
                </button>
                <button
                  type="button"
                  onClick={() => setBorderRadius("square")}
                  className={`rounded py-1 text-xs font-medium transition-all ${
                    borderRadius === "square" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Square Corners
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Background Theme</label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-1 h-[42px] items-center max-w-xs">
              <button
                type="button"
                onClick={() => setBackgroundTheme("light")}
                className={`rounded py-1 text-xs font-medium transition-all ${
                  backgroundTheme === "light" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Light Theme
              </button>
              <button
                type="button"
                onClick={() => setBackgroundTheme("dark")}
                className={`rounded py-1 text-xs font-medium transition-all ${
                  backgroundTheme === "dark" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dark Theme
              </button>
            </div>
          </div>
        </div>

        {/* DEFAULT & CUSTOM FIELDS */}
        <div className="space-y-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
          <div>
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

          <div className="pt-4 border-t border-slate-800">
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
            
            <input type="hidden" name="customFields" value={JSON.stringify({ defaultFields, customFields: fields, bookingButtonText, themeColor, borderRadius, backgroundTheme })} />
          
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 bg-slate-900/20 p-4 rounded-xl">
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
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 shadow-md"
          >
            {isPending ? "Saving..." : "Save Event Type"}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Interactive Preview */}
      <div className="lg:col-span-6 lg:sticky lg:top-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Preview
          </h3>
          <div className="flex gap-1.5 rounded-lg border border-slate-800 bg-slate-950 p-1">
            {(["desktop", "tablet", "mobile"] as const).map((device) => (
              <button
                key={device}
                type="button"
                onClick={() => setPreviewDevice(device)}
                className={`rounded px-2.5 py-1 text-[10px] font-semibold capitalize transition-all ${
                  previewDevice === device ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {device}
              </button>
            ))}
          </div>
        </div>

        {/* Simulated Mock Browser / Frame Wrapper */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col w-full">
          {/* Mock Frame Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            </div>
            
            {/* Step Toggle */}
            <div className="flex gap-1 rounded bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewStep("date_time")}
                className={`rounded px-2 py-0.5 text-[9px] font-medium transition-all ${
                  previewStep === "date_time" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Step 1: Calendar
              </button>
              <button
                type="button"
                onClick={() => setPreviewStep("details")}
                className={`rounded px-2 py-0.5 text-[9px] font-medium transition-all ${
                  previewStep === "details" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                Step 2: Details
              </button>
            </div>
          </div>

          {/* Iframe simulated area */}
          <div className="bg-slate-900/20 p-6 flex justify-center items-start overflow-hidden min-h-[580px]">
            <div
              style={{
                width: previewWidth,
                transition: "width 0.2s ease-in-out",
              }}
              className={`border shadow-lg overflow-hidden flex flex-col md:flex-row text-sm select-none ${
                previewIsDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
              } ${previewIsSquare ? "rounded-none" : "rounded-xl"}`}
            >
              {/* Mock Wizard Sidebar */}
              {!mockSidebarCollapsed && (
                <div 
                  className={`w-full md:w-2/5 p-6 flex flex-col border-r shrink-0 ${
                    previewIsDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      style={{ backgroundColor: themeColor + "15", color: themeColor }}
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                    >
                      N
                    </div>
                    <button
                      type="button"
                      onClick={() => setMockSidebarCollapsed(true)}
                      className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white"
                      title="Collapse details sidebar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mb-0.5">Nexoden</div>
                  <div className="font-bold text-base leading-tight truncate">{name || "Consultation Title"}</div>
                  
                  <div className="flex items-center text-slate-400 mt-3 gap-1.5 text-xs">
                    <svg className="w-4 h-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {duration} min
                  </div>

                  {previewStep === "details" && (
                    <div className="flex items-start mt-4 gap-1.5 text-xs">
                      <svg style={{ color: themeColor }} className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <div className="font-semibold" style={{ color: themeColor }}>Tuesday, 09/06/2026</div>
                        <div className="text-slate-400 mt-0.5 text-xs">9:50 AM (Europe/London)</div>
                      </div>
                    </div>
                  )}

                  {description && (
                    <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800 leading-relaxed line-clamp-4">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Mock Wizard Content Pane */}
              <div className="flex-1 p-6 flex flex-col justify-between min-h-[350px]">
                {previewStep === "date_time" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {mockSidebarCollapsed && (
                        <button
                          type="button"
                          onClick={() => setMockSidebarCollapsed(false)}
                          className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white"
                          title="Expand details sidebar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      )}
                      <div className="font-bold text-base">Select Date & Time</div>
                    </div>
                    
                    {/* Mock Mini Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 font-semibold mb-2">
                      <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 28 }).map((_, i) => {
                        const dayNum = i - 2;
                        const isSelectable = dayNum > 0 && dayNum < 24;
                        const isSelected = dayNum === 9;
                        
                        const dayStyle: React.CSSProperties = {
                          borderRadius: previewIsSquare ? "0px" : "999px"
                        };
                        if (isSelectable) {
                          if (isSelected) {
                            dayStyle.backgroundColor = themeColor;
                            dayStyle.color = "#fff";
                          } else {
                            dayStyle.color = themeColor;
                            dayStyle.backgroundColor = themeColor + "15";
                          }
                        }

                        return (
                          <div 
                            key={i} 
                            style={dayStyle}
                            className={`aspect-square flex items-center justify-center text-xs ${
                              !isSelectable ? "text-slate-300" : "font-semibold cursor-pointer"
                            }`}
                          >
                            {dayNum > 0 ? dayNum : ""}
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200/20 pt-4 flex flex-col items-center">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Viewing Timezone</div>
                      <div className={`text-xs px-4 py-1.5 rounded border ${previewIsDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                        Europe/London
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {mockSidebarCollapsed && (
                        <button
                          type="button"
                          onClick={() => setMockSidebarCollapsed(false)}
                          className="p-1 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white"
                          title="Expand details sidebar"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      )}
                      <div className="font-bold text-base">Enter Details</div>
                    </div>
                    
                    {/* Mock inputs based on form configurations */}
                    {defaultFields.name.enabled && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-400">{defaultFields.name.label} {defaultFields.name.required ? "*" : ""}</div>
                        <div className={`h-9 border w-full flex items-center px-3 text-xs text-slate-400 bg-slate-800/20 ${
                          previewIsDark ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-white"
                        } ${previewIsSquare ? "rounded-none" : "rounded-lg"}`}>John Doe</div>
                      </div>
                    )}

                    {defaultFields.email.enabled && (
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-400">{defaultFields.email.label} {defaultFields.email.required ? "*" : ""}</div>
                        <div className={`h-9 border w-full flex items-center px-3 text-xs text-slate-400 bg-slate-800/20 ${
                          previewIsDark ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-white"
                        } ${previewIsSquare ? "rounded-none" : "rounded-lg"}`}>john@example.com</div>
                      </div>
                    )}

                    {/* Submit Button Preview */}
                    <div className="pt-4">
                      <button
                        type="button"
                        style={{
                          backgroundColor: themeColor,
                          borderRadius: previewIsSquare ? "0px" : "8px"
                        }}
                        className="w-full text-white py-3 text-xs font-semibold hover:opacity-95 shadow transition-all"
                      >
                        {bookingButtonText}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { createEventTypeAction, updateEventTypeAction } from "@/actions/event-types";
import { useRouter } from "next/navigation";

export default function EventTypeForm({ eventType }: { eventType?: any }) {
  const router = useRouter();
  const [fields, setFields] = useState<any[]>(
    eventType?.customFields && Array.isArray(eventType.customFields)
      ? eventType.customFields
      : []
  );

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

  if (state.success) {
    router.push("/user/events");
  }

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
            required
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-300">URL Slug</label>
          <div className="mt-1 flex rounded-lg border border-slate-700 bg-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <span className="inline-flex items-center rounded-l-lg border-r border-slate-700 bg-slate-800 px-3 text-sm text-slate-400">
              /username/
            </span>
            <input
              type="text"
              id="slug"
              name="slug"
              defaultValue={eventType?.slug}
              required
              className="block w-full rounded-r-lg bg-transparent p-2.5 text-white focus:outline-none"
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

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Custom Fields</h3>
            <button
              type="button"
              onClick={addField}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              + Add Field
            </button>
          </div>
          
          <input type="hidden" name="customFields" value={JSON.stringify(fields)} />
          
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

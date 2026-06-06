"use client";

import { useActionState, useState, useEffect } from "react";
import { createWebhookAction } from "@/actions/webhook-actions";
import { useRouter } from "next/navigation";

const AVAILABLE_EVENTS = [
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
  "BOOKING_COMPLETED",
  "BOOKING_NO_SHOW",
];

export default function WebhookForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [state, formAction, isPending] = useActionState(createWebhookAction, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      router.push("/user/webhooks");
    }
  }, [state.success, router]);

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    setSecret(Array.from(array, byte => byte.toString(16).padStart(2, '0')).join(''));
  };

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300">Payload URL</label>
        <input
          type="url"
          name="url"
          required
          placeholder="https://your-domain.com/webhook"
          className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-300">Secret</label>
          <button
            type="button"
            onClick={generateSecret}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            Generate Secret
          </button>
        </div>
        <input
          type="text"
          name="secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Leave blank to skip signing"
          className="block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-500">Used to sign requests so you can verify they came from NexCal.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Events to send</label>
        <div className="space-y-2">
          {AVAILABLE_EVENTS.map((event) => (
            <div key={event} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="events"
                value={event}
                id={`event-${event}`}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor={`event-${event}`} className="text-sm text-slate-300 cursor-pointer">
                {event}
              </label>
            </div>
          ))}
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
          {isPending ? "Saving..." : "Add Webhook"}
        </button>
      </div>
    </form>
  );
}

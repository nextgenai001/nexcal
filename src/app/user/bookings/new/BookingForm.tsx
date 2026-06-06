"use client";

import { useActionState } from "react";
import { createManualBookingAction } from "@/actions/booking-actions";
import { useRouter } from "next/navigation";

export default function BookingForm({ eventTypes }: { eventTypes: any[] }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createManualBookingAction, { success: false, error: null });

  if (state.success) {
    router.push("/user/bookings");
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {eventTypes.length === 0 ? (
        <p className="text-sm text-slate-400">You need to create an event type first before adding a booking.</p>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-300">Event Type</label>
            <select
              name="eventTypeId"
              required
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {eventTypes.map(et => (
                <option key={et.id} value={et.id}>{et.name} ({et.duration} min)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Customer Name</label>
            <input
              type="text"
              name="customerName"
              required
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Customer Email (Optional)</label>
            <input
              type="email"
              name="customerEmail"
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Date</label>
              <input
                type="date"
                name="date"
                required
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Time (UTC)</label>
              <input
                type="time"
                name="time"
                required
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
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
              {isPending ? "Saving..." : "Add Booking"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

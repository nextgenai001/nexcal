"use client";

import { useState, useTransition } from "react";
import { updateBookingStatusAction, updateBookingNotesAction, cancelBookingAction } from "@/actions/booking-actions";

export default function BookingActions({ booking }: { booking: any }) {
  const [notes, setNotes] = useState(booking.notes || "");
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: any) => {
    startTransition(() => {
      updateBookingStatusAction(booking.id, status);
    });
  };

  const handleNotesSave = () => {
    startTransition(() => {
      updateBookingNotesAction(booking.id, notes);
    });
  };

  const handleCancel = () => {
    startTransition(() => {
      cancelBookingAction(booking.id, cancelReason);
      setShowCancelDialog(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="font-semibold mb-4">Update Status</h3>
        <div className="flex flex-col gap-2">
          {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
            <button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={isPending}
              className="rounded-lg bg-blue-600/20 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-600/30 text-left"
            >
              Mark as Completed
            </button>
          )}
          {booking.status !== "NO_SHOW" && booking.status !== "CANCELLED" && (
            <button
              onClick={() => handleStatusChange("NO_SHOW")}
              disabled={isPending}
              className="rounded-lg bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 text-left"
            >
              Mark as No Show
            </button>
          )}
          {booking.status !== "CANCELLED" && (
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={isPending}
              className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 text-left"
            >
              Cancel Booking
            </button>
          )}
        </div>

        {showCancelDialog && (
          <div className="mt-4 p-4 rounded-lg border border-red-500/30 bg-red-500/5 space-y-3">
            <label className="block text-sm font-medium text-red-400">Cancellation Reason</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Abort
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending || !cancelReason}
                className="rounded bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="font-semibold mb-4">Internal Notes</h3>
        <p className="text-xs text-slate-400 mb-3">Only visible to you. Customers will not see this.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          rows={5}
          placeholder="Add notes about the customer or appointment..."
        />
        <button
          onClick={handleNotesSave}
          disabled={isPending || notes === booking.notes}
          className="mt-3 w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleEventTypeAction, deleteEventTypeAction } from "@/actions/event-types";
import { format } from "date-fns";

export default function EventTypeCard({ eventType, username }: { eventType: any, username: string }) {
  const [isActive, setIsActive] = useState(eventType.isActive);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    startTransition(() => {
      toggleEventTypeAction(eventType.id, nextState);
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this event type?")) {
      startTransition(() => {
        deleteEventTypeAction(eventType.id);
      });
    }
  };

  const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${username}/${eventType.slug}`;
  const embedCode = `<iframe src="${bookingLink}?embed=true" width="100%" height="600" frameborder="0"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    alert("Copied link to clipboard!");
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    alert("Copied HTML embed code to clipboard!");
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{eventType.name}</h3>
          <p className="text-sm text-slate-400">/{eventType.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isActive}
              onChange={handleToggle}
              disabled={isPending}
            />
            <div className="peer h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
          </label>
        </div>
      </div>
      
      <p className="mb-6 flex-1 text-sm text-slate-400 line-clamp-2">
        {eventType.description || "No description"}
      </p>

      <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {eventType.duration}m
        </div>

        {eventType.startDate && eventType.endDate && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-0.5 ml-auto">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>
              {format(new Date(eventType.startDate), "MMM d")} - {format(new Date(eventType.endDate), "MMM d, yyyy")}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleCopyLink}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
            title="Copy booking link"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
            Copy Link
          </button>
          <button
            onClick={handleCopyEmbed}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
            title="Copy HTML iframe embed code"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            Copy Embed
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/user/events/${eventType.id}`}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

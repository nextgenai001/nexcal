"use client";

import { useTransition } from "react";
import { deleteWebhookAction, toggleWebhookAction } from "@/actions/webhook-actions";
import Link from "next/link";
import { format } from "date-fns";

export default function WebhookList({ webhooks }: { webhooks: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, current: boolean) => {
    startTransition(() => {
      toggleWebhookAction(id, !current);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      startTransition(() => {
        deleteWebhookAction(id);
      });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {webhooks.map((webhook) => (
        <div key={webhook.id} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 truncate pr-4">
              <h3 className="font-semibold truncate text-white" title={webhook.url}>{webhook.url}</h3>
              <p className="text-xs text-slate-400 mt-1">Added {format(webhook.createdAt, "MMM d, yyyy")}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={webhook.isActive}
                onChange={() => handleToggle(webhook.id, webhook.isActive)}
                disabled={isPending}
              />
              <div className="peer h-5 w-9 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
            </label>
          </div>

          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Trigger Filter</p>
            <span className={`inline-block rounded px-2.5 py-1 text-xs font-medium ${
              webhook.eventType 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" 
                : "bg-slate-800 text-slate-300"
            }`}>
              {webhook.eventType ? `Only: ${webhook.eventType.name}` : "All Events (Global)"}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Events</p>
            <div className="flex flex-wrap gap-2">
              {webhook.events.map((event: string) => (
                <span key={event} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
                  {event}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-slate-800 pt-4 gap-2">
            <div className="flex gap-4">
              <Link
                href={`/user/webhooks/${webhook.id}/logs`}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Logs
              </Link>
              <Link
                href={`/user/webhooks/${webhook.id}/edit`}
                className="text-sm text-slate-300 hover:text-white"
              >
                Edit
              </Link>
            </div>
            <button
              onClick={() => handleDelete(webhook.id)}
              disabled={isPending}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

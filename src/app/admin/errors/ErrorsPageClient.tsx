"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { deleteErrorLogAction, clearAllErrorLogsAction, updateRetentionDaysAction } from "@/actions/errors";

interface ErrorLogItem {
  id: string;
  message: string;
  stack: string | null;
  path: string | null;
  userId: string | null;
  component: string;
  metadata: any;
  createdAt: Date;
  user?: {
    name: string;
    username: string;
  } | null;
}

interface Props {
  initialLogs: ErrorLogItem[];
  retentionDays: number;
}

export default function ErrorsPageClient({ initialLogs, retentionDays }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [retention, setRetention] = useState(retentionDays);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this error log entry?")) return;
    
    startTransition(async () => {
      const res = await deleteErrorLogAction(id);
      if (res.success) {
        setLogs(prev => prev.filter(log => log.id !== id));
      } else {
        alert(res.error || "Failed to delete log");
      }
    });
  };

  const handleClearAll = async () => {
    if (!confirm("CRITICAL: Are you sure you want to delete ALL error log entries? This action is permanent!")) return;

    startTransition(async () => {
      const res = await clearAllErrorLogsAction();
      if (res.success) {
        setLogs([]);
      } else {
        alert(res.error || "Failed to clear logs");
      }
    });
  };

  const handleSaveRetention = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(false);

    startTransition(async () => {
      const res = await updateRetentionDaysAction(retention);
      if (res.success) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        alert(res.error || "Failed to update retention policy");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings & Header Controls */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Error Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor, debug, and configure retention for platform exceptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Retention settings form */}
          <form onSubmit={handleSaveRetention} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2">
            <label htmlFor="retention" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Retention:
            </label>
            <input
              type="number"
              id="retention"
              min={1}
              value={retention}
              onChange={(e) => setRetention(parseInt(e.target.value, 10))}
              className="w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500">days</span>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Save
            </button>
            {settingsSuccess && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse ml-1">✓ Saved</span>
            )}
          </form>

          {/* Clear All button */}
          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isPending}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/25 disabled:opacity-55"
            >
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {logs.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/40 text-emerald-500">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-300">Clean slate!</p>
            <p className="text-xs text-slate-500 mt-1">No application errors have been logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Timestamp
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tenant
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Path & Message
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-slate-800/20">
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs">
                        <p className="font-semibold text-slate-300">
                          {format(new Date(log.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-slate-500">
                          {format(new Date(log.createdAt), "HH:mm:ss")}
                        </p>
                      </td>

                      {/* Source component */}
                      <td className="px-5 py-3.5 text-xs">
                        <span className={`inline-block rounded-md px-2 py-0.5 font-bold tracking-wider ring-1
                          ${log.component === 'CLIENT' ? 'bg-sky-500/10 text-sky-400 ring-sky-500/20' : ''}
                          ${log.component === 'SERVER' ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20' : ''}
                          ${log.component === 'API' ? 'bg-amber-500/10 text-amber-400 ring-amber-500/20' : ''}
                        `}>
                          {log.component}
                        </span>
                      </td>

                      {/* Tenant affected */}
                      <td className="px-5 py-3.5 text-xs">
                        {log.user ? (
                          <div>
                            <Link href={`/admin/users/${log.userId}`} className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                              {log.user.name}
                            </Link>
                            <p className="text-slate-500">@{log.user.username}</p>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Path & Message */}
                      <td className="px-5 py-3.5 text-xs max-w-lg">
                        {log.path && (
                          <code className="text-slate-500 font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded mr-2">
                            {log.path}
                          </code>
                        )}
                        <span className="font-medium text-slate-300 line-clamp-2 mt-1">{log.message}</span>
                        
                        {/* Expanded details (stack trace & metadata) */}
                        {isExpanded && (
                          <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 animate-fadeIn">
                            {log.stack && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stack Trace:</p>
                                <pre className="max-h-60 overflow-y-auto overflow-x-auto rounded bg-slate-950 p-2.5 font-mono text-[11px] text-red-300 leading-relaxed scrollbar-thin">
                                  <code>{log.stack}</code>
                                </pre>
                              </div>
                            )}
                            {Object.keys(log.metadata || {}).length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metadata:</p>
                                <pre className="overflow-x-auto rounded bg-slate-950 p-2.5 font-mono text-[11px] text-slate-400">
                                  <code>{JSON.stringify(log.metadata, null, 2)}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs">
                        <div className="flex items-center justify-end gap-3">
                          {(log.stack || Object.keys(log.metadata || {}).length > 0) && (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-slate-400 hover:text-white font-medium"
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(log.id)}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-400 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

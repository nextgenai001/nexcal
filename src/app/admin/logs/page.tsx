import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { format } from "date-fns";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Logs" };

const PAGE_SIZE = 50;

// ── Color coding ─────────────────────────────────────────────────────────────

function getActionStyle(action: string): string {
  if (action.includes("CREATED") || action.includes("REACTIVATED")) {
    return "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25";
  }
  if (action.includes("DEACTIVATED") || action.includes("DELETED")) {
    return "bg-red-500/15 text-red-400 ring-1 ring-red-500/25";
  }
  if (action.includes("CANCELLED")) {
    return "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25";
  }
  if (action.includes("UPDATED") || action.includes("RESET") || action.includes("RESCHEDULED")) {
    return "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25";
  }
  if (action.includes("FAILED")) {
    return "bg-red-500/15 text-red-400 ring-1 ring-red-500/25";
  }
  return "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, username: true } },
        target: { select: { name: true, username: true } },
      },
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-400">
          {total.toLocaleString()} total log entries across the platform
        </p>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No audit logs yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Timestamp
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actor
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Target
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Metadata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-800/30">
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-slate-300">
                            {format(new Date(log.createdAt), "MMM d, yyyy")}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {format(new Date(log.createdAt), "HH:mm:ss")}
                          </p>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getActionStyle(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-3.5">
                        {log.actor ? (
                          <div>
                            <p className="text-sm text-slate-300">{log.actor.name}</p>
                            <p className="text-[11px] text-slate-600">@{log.actor.username}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">System</span>
                        )}
                      </td>

                      {/* Target */}
                      <td className="px-5 py-3.5">
                        {log.target ? (
                          <div>
                            <p className="text-sm text-slate-300">{log.target.name}</p>
                            <p className="text-[11px] text-slate-600">@{log.target.username}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>

                      {/* Metadata preview */}
                      <td className="max-w-xs px-5 py-3.5">
                        <code className="block truncate rounded bg-slate-800/60 px-2 py-1 text-[11px] text-slate-400">
                          {JSON.stringify(log.metadata)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {total.toLocaleString()} entries
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={`/admin/logs?page=${page - 1}`}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white"
                    >
                      ← Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/admin/logs?page=${page + 1}`}
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

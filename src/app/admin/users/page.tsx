import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import UsersSearchClient from "./UsersSearchClient";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();

  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: {
      role: "TENANT",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
              { businessName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          bookings: true,
          eventTypes: true,
          webhookEndpoints: true,
        },
      },
      webhookEndpoints: {
        select: {
          _count: {
            select: {
              deliveries: {
                where: { status: "SUCCESS" },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Users</h1>
          <p className="mt-1 text-sm text-slate-400">
            {users.length} tenant{users.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Tenant
        </Link>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <UsersSearchClient initialQ={search} />

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {search ? `No tenants matching "${search}"` : "No tenants yet"}
            </p>
            {!search && (
              <Link
                href="/admin/users/new"
                className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300"
              >
                Create your first tenant →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tenant
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Timezone
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bookings
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Webhooks
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Joined
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-slate-800/40"
                  >
                    {/* Tenant info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-sm font-bold text-indigo-400">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                          {user.businessName && (
                            <p className="text-xs text-slate-600">{user.businessName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-300">{user.email}</span>
                    </td>

                    {/* Timezone */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-400">{user.timezone}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Bookings count */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-semibold text-slate-300">
                        {user._count.bookings}
                      </span>
                    </td>

                    {/* Webhooks count */}
                    <td className="px-5 py-3.5 text-center">
                      {(() => {
                        const endpoints = user._count.webhookEndpoints;
                        const deliveries = user.webhookEndpoints.reduce(
                          (acc, curr) => acc + curr._count.deliveries,
                          0
                        );
                        return (
                          <div>
                            <span className="text-sm font-semibold text-slate-300">
                              {endpoints}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">
                              ({deliveries})
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Created */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-500">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export const metadata = {
  title: "Webhook Logs - NexCal",
};

export default async function WebhookLogsPage({ params }: { params: { id: string } }) {
  const user = await requireTenant();

  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: params.id, userId: user.id },
  });

  if (!webhook) {
    notFound();
  }

  const logs = await prisma.webhookDelivery.findMany({
    where: { webhookId: webhook.id },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to recent 50 logs
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Logs</h1>
          <p className="text-sm text-slate-400">Recent events sent to {webhook.url}</p>
        </div>
        <Link
          href="/user/webhooks"
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to Webhooks
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Response</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    No delivery logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800">
                    <td className="px-6 py-4 font-medium text-white">{log.event}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
                        ${log.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' : ''}
                        ${log.status === 'FAILED' ? 'bg-red-500/10 text-red-400' : ''}
                        ${log.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                      `}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {format(log.createdAt, "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      {log.responseCode ? (
                        <span className={log.responseCode >= 200 && log.responseCode < 300 ? 'text-green-400' : 'text-red-400'}>
                          {log.responseCode}
                        </span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

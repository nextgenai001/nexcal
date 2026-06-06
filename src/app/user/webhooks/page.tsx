import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WebhookList from "./WebhookList";

export const metadata = {
  title: "Webhooks - NexCal",
};

export default async function WebhooksPage() {
  const user = await requireTenant();

  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-sm text-slate-400">Receive real-time updates about your bookings</p>
        </div>
        <Link
          href="/user/webhooks/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Add Webhook
        </Link>
      </div>

      {webhooks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-400">No webhooks configured.</p>
          <Link
            href="/user/webhooks/new"
            className="mt-4 inline-block text-indigo-400 hover:text-indigo-300"
          >
            Create your first webhook
          </Link>
        </div>
      ) : (
        <WebhookList webhooks={webhooks} />
      )}
    </div>
  );
}

import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import WebhookForm from "../../new/WebhookForm";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Webhook - NexCal",
};

export default async function EditWebhookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireTenant();
  const { id } = await params;

  const [webhook, eventTypes] = await Promise.all([
    prisma.webhookEndpoint.findFirst({
      where: { id, userId: user.id },
    }),
    prisma.eventType.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" }
    })
  ]);

  if (!webhook) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Webhook</h1>
        <p className="text-sm text-slate-400">Update your webhook endpoint configuration</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <WebhookForm webhook={webhook} eventTypes={eventTypes} />
      </div>
    </div>
  );
}

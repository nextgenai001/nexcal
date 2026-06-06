import { requireTenant } from "@/lib/rbac";
import WebhookForm from "./WebhookForm";

export const metadata = {
  title: "Add Webhook - NexCal",
};

export default async function NewWebhookPage() {
  await requireTenant();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Webhook</h1>
        <p className="text-sm text-slate-400">Configure a new endpoint to receive events</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <WebhookForm />
      </div>
    </div>
  );
}

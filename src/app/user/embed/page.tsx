import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import EmbedPreviewClient from "./EmbedPreviewClient";

export const metadata = {
  title: "Embedded UI - NexCal",
};

export default async function EmbedPage() {
  const user = await requireTenant();

  const eventTypes = await prisma.eventType.findMany({
    where: {
      userId: user.id,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Embedded UI</h1>
        <p className="text-sm text-slate-400">
          Preview how your scheduling pages will look when embedded on your website and generate the code.
        </p>
      </div>

      <EmbedPreviewClient username={user.username} eventTypes={eventTypes} />
    </div>
  );
}

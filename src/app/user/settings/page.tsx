import { requireTenant } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";
import EmbedCodeGenerator from "./EmbedCodeGenerator";

export const metadata = {
  title: "Settings - NexCal",
};

export default async function SettingsPage() {
  const sessionUser = await requireTenant();
  
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      username: true,
      businessName: true,
      timezone: true,
    },
  });

  const user = dbUser ? { ...sessionUser, ...dbUser } : sessionUser;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">Manage your business profile and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
          <SettingsForm user={user} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Embed on your website</h2>
          <EmbedCodeGenerator username={user.username} />
        </div>
      </div>
    </div>
  );
}

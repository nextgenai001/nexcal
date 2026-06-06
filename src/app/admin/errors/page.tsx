import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import ErrorsPageClient from "./ErrorsPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Error Logs" };

export default async function ErrorsAdminPage() {
  await requireAdmin();

  // Fetch all platform error logs
  const logs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          username: true,
        },
      },
    },
  });

  // Fetch the retention days setting
  const retentionSetting = await prisma.systemSetting.findUnique({
    where: { key: "error_log_retention_days" },
  });

  const retentionDays = retentionSetting ? parseInt(retentionSetting.value, 10) : 30;

  return (
    <ErrorsPageClient initialLogs={logs} retentionDays={retentionDays} />
  );
}

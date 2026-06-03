import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslator } from "@/lib/i18n/server";
import { EmbedUiClient } from "@/components/admin/embed-ui-client";

export const metadata = {
  title: "Embedded UI",
};

export default async function EmbedUiPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let orgSlug = "";
  if (session.user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { slug: true },
    });
    orgSlug = org?.slug || "";
  }

  const { t } = await getTranslator();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("admin.embed.title")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("admin.embed.subtitle")}
        </p>
      </div>

      <EmbedUiClient
        orgSlug={orgSlug}
        translations={{
          themeLabel: t("admin.embed.themeLabel"),
          themeBlue: t("admin.embed.themeBlue"),
          themeMono: t("admin.embed.themeMono"),
          embedModeLabel: t("admin.embed.embedModeLabel"),
          embedModeDesc: t("admin.embed.embedModeDesc"),
          copySnippet: t("admin.embed.copySnippet"),
          snippetCopied: t("admin.embed.snippetCopied"),
          snippetInstructions: t("admin.embed.snippetInstructions"),
          livePreview: t("admin.embed.livePreview"),
          noOrgError: t("admin.embed.noOrgError"),
          previewWidth: t("admin.embed.previewWidth"),
          previewHeight: t("admin.embed.previewHeight"),
          viewExternal: t("admin.embed.viewExternal"),
        }}
      />
    </div>
  );
}

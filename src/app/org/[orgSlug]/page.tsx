import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/components/booking/booking-wizard";

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ theme?: string; embed?: string }>;
}

export default async function OrgBookingPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { theme, embed } = await searchParams;

  // 1. Fetch organization by slug
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!org) {
    notFound();
  }

  // 2. Fetch providers belonging to this organization with active services
  const providers = await prisma.user.findMany({
    where: {
      organizationId: org.id,
      serviceTypes: { some: { isActive: true } },
    },
    select: {
      id: true,
      name: true,
      clinicName: true,
    },
    orderBy: { name: "asc" },
  });

  // Safe checks for embed/theme props
  const isEmbed = embed === "true";
  const activeTheme = theme === "mono" ? "mono" : "blue";

  return (
    <BookingWizard
      providers={providers}
      orgName={org.name}
      logoUrl={org.logoUrl}
      theme={activeTheme}
      embed={isEmbed}
    />
  );
}

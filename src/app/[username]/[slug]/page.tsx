import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BookingWizard from '@/components/booking/BookingWizard';

interface Props {
  params: Promise<{
    username: string;
    slug: string;
  }>;
  searchParams: Promise<{
    embed?: string;
  }>;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const sParams = await searchParams;
  const isEmbed = sParams.embed === "true";

  let user = null;
  if (isEmbed) {
    try {
      user = await prisma.user.update({
        where: { username, isActive: true },
        data: { embedViews: { increment: 1 } },
        select: {
          id: true,
          username: true,
          businessName: true,
          name: true,
          businessLogo: true,
          timezone: true,
          weekStart: true,
          dateFormat: true
        }
      });
    } catch (e) {
      // ignore
    }
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { username, isActive: true },
      select: {
        id: true,
        username: true,
        businessName: true,
        name: true,
        businessLogo: true,
        timezone: true,
        weekStart: true,
        dateFormat: true
      }
    });
  }

  if (!user) {
    notFound();
  }

  const eventType = await prisma.eventType.findUnique({
    where: {
      userId_slug: { userId: user.id, slug },
      isActive: true
    }
  });

  if (!eventType) {
    notFound();
  }

  return (
    <div className="w-full">
      <BookingWizard user={user} eventType={eventType} />
    </div>
  );
}

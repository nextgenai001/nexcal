import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BookingWizard from '@/components/booking/BookingWizard';

interface Props {
  params: Promise<{
    username: string;
    slug: string;
  }>;
}

export default async function BookingPage({ params }: Props) {
  const { username, slug } = await params;

  const user = await prisma.user.findUnique({
    where: { username, isActive: true },
    select: {
      id: true,
      username: true,
      businessName: true,
      name: true,
      businessLogo: true,
      timezone: true
    }
  });

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

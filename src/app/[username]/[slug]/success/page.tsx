import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface Props {
  params: Promise<{
    username: string;
    slug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingSuccessPage({ params, searchParams }: Props) {
  const { username, slug } = await params;
  const { token } = await searchParams;

  if (!token || typeof token !== 'string') {
    notFound();
  }

  const booking = await prisma.booking.findUnique({
    where: { managementToken: token },
    include: {
      user: true,
      eventType: true
    }
  });

  if (!booking || booking.user.username !== username || booking.eventType.slug !== slug) {
    notFound();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 text-center max-w-2xl mx-auto mt-12">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Booking Confirmed!</h1>
      <p className="text-slate-500 mb-8">
        You are scheduled with {booking.user.businessName || booking.user.name}. A calendar invitation has been sent to your email address.
      </p>

      <div className="bg-slate-50 rounded-xl p-6 text-left border border-slate-100 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-4 border-b border-slate-200">
          Booking Details
        </h2>
        
        <div className="space-y-3">
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-medium text-sm">Event</span>
            <span className="w-2/3 text-slate-800 font-medium">{booking.eventType.name}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-medium text-sm">Name</span>
            <span className="w-2/3 text-slate-800">{booking.customerName}</span>
          </div>
          <div className="flex">
            <span className="w-1/3 text-slate-500 font-medium text-sm">Email</span>
            <span className="w-2/3 text-slate-800">{booking.customerEmail}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 italic">
            * The time shown on your calendar invitation will be in your local timezone.
          </p>
        </div>
      </div>

      <Link 
        href={`/${username}`}
        className="inline-flex justify-center items-center px-6 py-3 border border-slate-300 shadow-sm text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Book another meeting
      </Link>
    </div>
  );
}

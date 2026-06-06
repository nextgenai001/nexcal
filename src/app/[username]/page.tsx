import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

interface Props {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    embed?: string;
  }>;
}

export default async function TenantProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const sParams = await searchParams;
  const isEmbed = sParams.embed === "true";
  
  let user = null;
  if (isEmbed) {
    try {
      user = await prisma.user.update({
        where: { username, isActive: true },
        data: { embedViews: { increment: 1 } },
        include: {
          eventTypes: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        }
      });
    } catch (e) {
      // ignore, user might not exist and will fail below
    }
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { username, isActive: true },
      include: {
        eventTypes: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });
  }

  if (!user) {
    notFound();
  }

  const displayName = user.businessName || user.name || username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center">
      {user.businessLogo ? (
        <img 
          src={user.businessLogo} 
          alt={displayName} 
          className="w-24 h-24 rounded-full mb-4 shadow-sm object-cover" 
        />
      ) : (
        <div className="w-24 h-24 rounded-full mb-4 bg-blue-100 text-blue-600 flex items-center justify-center text-4xl font-bold shadow-sm">
          {initial}
        </div>
      )}
      
      <h1 className="text-2xl font-bold mb-2 text-slate-800">{displayName}</h1>
      <p className="text-slate-500 mb-10 text-center max-w-lg">
        Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.
      </p>

      <div className="w-full grid gap-4 md:grid-cols-2">
        {user.eventTypes.map((et) => (
          <Link href={`/${username}/${et.slug}`} key={et.id} className="block group">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 h-full flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {et.name}
                </h2>
                {et.color && (
                  <span 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: et.color }}
                  />
                )}
              </div>
              <p className="text-slate-500 text-sm flex-grow">
                {et.description || 'No description provided.'}
              </p>
              <div className="mt-6 flex items-center text-sm font-medium text-slate-600 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {et.duration} min
              </div>
            </div>
          </Link>
        ))}
      </div>

      {user.eventTypes.length === 0 && (
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 w-full shadow-sm">
          <p className="text-slate-500">No active event types available.</p>
        </div>
      )}
    </div>
  );
}

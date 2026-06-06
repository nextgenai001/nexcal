import React, { Suspense } from 'react';
import EmbedResizer from '@/components/booking/EmbedResizer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-200">
      <Suspense fallback={null}>
        <EmbedResizer />
      </Suspense>
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-24">
        {children}
      </main>
    </div>
  );
}

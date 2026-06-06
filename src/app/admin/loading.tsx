export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-xl bg-slate-800" />
        <div className="h-4 w-72 rounded-lg bg-slate-800/70" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-800" />
                <div className="h-8 w-16 rounded-lg bg-slate-700" />
                <div className="h-3 w-32 rounded bg-slate-800/70" />
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Content card skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-36 rounded-lg bg-slate-800" />
          <div className="h-4 w-16 rounded bg-slate-800" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-slate-800/60 py-3 last:border-0"
            >
              <div className="h-5 w-32 rounded-full bg-slate-800" />
              <div className="flex-1">
                <div className="h-4 w-48 rounded bg-slate-800" />
              </div>
              <div className="h-3 w-20 rounded bg-slate-800/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

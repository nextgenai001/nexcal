"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export default function UsersSearchClient({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        type="text"
        defaultValue={initialQ}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name, email, or username…"
        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 sm:max-w-sm"
      />
      {isPending && (
        <div className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
      )}
    </div>
  );
}

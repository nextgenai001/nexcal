"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-xl font-bold text-white">Something went wrong!</h2>
        <p className="mb-6 text-sm text-slate-400">
          An unexpected error occurred while loading this page.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

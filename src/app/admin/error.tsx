"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logErrorAction } from "@/actions/errors";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminError]", error);
    logErrorAction(
      error.message || "Unknown admin layout error",
      error.stack,
      typeof window !== "undefined" ? window.location.pathname : undefined,
      "CLIENT",
      { digest: error.digest }
    );
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
          <svg
            className="h-8 w-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="mb-2 text-lg font-bold text-white">Something went wrong</h2>
        <p className="mb-6 text-sm text-slate-400">
          An unexpected error occurred while loading this page. Please try again or return to
          the dashboard.
        </p>

        {error.digest && (
          <p className="mb-5 rounded-lg bg-slate-800 px-3 py-2 font-mono text-xs text-slate-500">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 active:scale-95"
          >
            Try Again
          </button>
          <Link
            href="/admin/dashboard"
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">Access Denied</h1>
        <p className="mb-8 text-sm text-slate-400">
          You don&apos;t have permission to view this page. Please sign in with an appropriate
          account.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 hover:border-slate-600 hover:text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

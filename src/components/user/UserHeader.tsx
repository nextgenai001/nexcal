"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";

export default function UserHeader({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      logoutAction();
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
      <h1 className="text-lg font-semibold text-white">
        {user.businessName || "My Business"}
      </h1>
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
      >
        {isPending ? "Signing out..." : "Sign out"}
      </button>
    </header>
  );
}

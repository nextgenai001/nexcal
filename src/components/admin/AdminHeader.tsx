import { logoutAction } from "@/actions/auth";
import type { AuthenticatedUser } from "@/lib/rbac";

interface AdminHeaderProps {
  user: AuthenticatedUser;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-sm">
      {/* Left: empty or breadcrumb placeholder */}
      <div className="hidden lg:block" />

      {/* Mobile: spacer to account for the hamburger button */}
      <div className="w-9 lg:hidden" />

      {/* Right: User info + sign out */}
      <div className="flex items-center gap-3">
        {/* Platform Admin badge */}
        <span className="hidden rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-400 ring-1 ring-violet-500/30 sm:inline-block">
          Platform Admin
        </span>

        {/* Avatar + name */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/20">
            {user.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden text-sm font-medium text-slate-300 sm:block">
            {user.name ?? user.email ?? "Admin"}
          </span>
        </div>

        {/* Sign out form */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

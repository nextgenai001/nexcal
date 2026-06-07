"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface BookingFilterTabsProps {
  currentTab: string;
  q: string;
  status: string;
}

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "unconfirmed", label: "Unconfirmed" },
  { id: "past", label: "Past" },
  { id: "canceled", label: "Canceled" },
];

export default function BookingFilterTabs({ currentTab, q, status }: BookingFilterTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    return params.toString();
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q") as string;
    const statusVal = formData.get("status") as string;

    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    else params.delete("q");

    if (statusVal && statusVal !== "ALL") params.set("status", statusVal);
    else params.delete("status");

    router.push(`/user/bookings?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("status");
    router.push(`/user/bookings?${params.toString()}`);
  };

  const hasActiveFilters = q || status !== "ALL";

  return (
    <div>
      {/* Tab bar container */}
      <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-950/20">
        <div className="flex flex-wrap items-center gap-1">
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/user/bookings?${createQueryString("tab", tab.id)}`}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
            
            <div className="mx-1 h-5 w-[1px] bg-slate-800" />
            
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                showFilterPanel || hasActiveFilters
                  ? "bg-indigo-600/15 text-indigo-400 ring-1 ring-indigo-500/30"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.24 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Clear active filters
          </button>
        )}
      </div>

      {/* Expandable filter/search panel */}
      {(showFilterPanel || hasActiveFilters) && (
        <div className="border-b border-slate-800 bg-slate-900/40 p-4 transition-all duration-200">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                </svg>
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

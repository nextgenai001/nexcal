import React from "react";

export default function Loading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

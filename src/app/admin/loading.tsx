export default function AdminLoading() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="absolute h-full w-full animate-[spin_1.5s_linear_infinite] rounded-full border-4 border-indigo-500/20" />
        <div className="absolute h-full w-full animate-[spin_1s_ease-in-out_infinite] rounded-full border-4 border-transparent border-t-indigo-500" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
}

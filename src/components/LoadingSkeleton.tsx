import React from "react";

export const LoadingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading attendance analytics data"
      className="space-y-6 animate-pulse"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 md:col-span-5" />
          <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 md:col-span-3" />
          <div className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 md:col-span-4" />
        </div>
        <div className="mt-4 h-9 w-full rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>

      <div className="h-80 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-2 h-3 w-72 rounded bg-slate-100 dark:bg-slate-800/60" />
        <div className="mt-6 h-56 rounded-lg bg-slate-100 dark:bg-slate-800/50" />
      </div>
    </div>
  );
};

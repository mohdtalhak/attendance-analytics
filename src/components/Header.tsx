import React from "react";
import { RefreshCw, Sun, Moon, Monitor, HelpCircle, LogOut } from "lucide-react";

export type ThemePreference = "system" | "light" | "dark";

interface HeaderProps {
  lastSyncedTime: string | null;
  isSyncing: boolean;
  onSyncNow: () => void;
  themePref: ThemePreference;
  onToggleTheme: () => void;
  onOpenSyncGuide: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastSyncedTime,
  isSyncing,
  onSyncNow,
  themePref,
  onToggleTheme,
  onOpenSyncGuide,
  onLogout,
}) => {
  const themeLabel =
    themePref === "system"
      ? "System theme"
      : themePref === "dark"
      ? "Dark theme"
      : "Light theme";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Zone */}
        <a
          href="#overview"
          className="text-lg font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-100 whitespace-nowrap"
        >
          Attendance Analytics
        </a>

        {/* Navigation links */}
        <nav
          aria-label="Dashboard sections"
          className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
        >
          <a
            href="#overview"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-slate-100"
          >
            Overview
          </a>
          <a
            href="#charts"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-slate-100"
          >
            Visualizations
          </a>
          <a
            href="#leaderboard"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-slate-100"
          >
            Leaderboard
          </a>
          <a
            href="#student-lookup"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-slate-100"
          >
            Student lookup
          </a>
          <a
            href="#data-quality"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-slate-100"
          >
            Data quality
          </a>
        </nav>

        {/* Sync status & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap"
            aria-live="polite"
          >
            Synced: {lastSyncedTime || "--:--:--"}
          </span>

          <button
            type="button"
            onClick={onOpenSyncGuide}
            title="How to test real-time syncing and sheet changes"
            className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#3b6fe0]" aria-hidden="true" />
            <span>Sync testing</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title={`Switch theme (current: ${themeLabel})`}
            aria-label={`Switch theme (current: ${themeLabel})`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shrink-0"
          >
            {themePref === "system" ? (
              <Monitor className="h-4 w-4" aria-hidden="true" />
            ) : themePref === "dark" ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#3b6fe0] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f5ec4] disabled:cursor-not-allowed disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 shrink-0 ${isSyncing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync data"}</span>
            <span className="sm:hidden">{isSyncing ? "..." : "Sync"}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Log out of attendance dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/40 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
};


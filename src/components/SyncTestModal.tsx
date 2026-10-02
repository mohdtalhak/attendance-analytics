import React from "react";
import { X, CheckCircle, RefreshCw, Layers, Clock } from "lucide-react";

interface SyncTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastSyncedTime: string | null;
  isSyncing: boolean;
  onSyncNow: () => void;
}

export const SyncTestModal: React.FC<SyncTestModalProps> = ({
  isOpen,
  onClose,
  lastSyncedTime,
  isSyncing,
  onSyncNow,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sync testing guide"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 text-[#3b6fe0]" />
          <h2
            id="sync-guide-title"
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            How to Test Real-Time Syncing & Data Changes
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            The dashboard connects directly to your college Google Apps Script JSON endpoint.
            Here is exactly how the real-time syncing works and how you can verify changes:
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                1
              </span>
              <div>
                <strong className="text-slate-900 dark:text-slate-100">
                  Two-tier caching architecture:
                </strong>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Google Apps Script caches sheet data on Google's servers for <strong>2 minutes</strong> to keep requests instantaneous (~50 KB payload).
                  When you click <strong>&quot;Sync data&quot;</strong>, the dashboard appends <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px] dark:bg-slate-700">?refresh=1</code> to skip that server cache and force Google Apps Script to re-read the raw cells from Google Sheets right away.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                2
              </span>
              <div>
                <strong className="text-slate-900 dark:text-slate-100">
                  Step-by-step test procedure:
                </strong>
                <ol className="mt-1 list-decimal list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <li>Open the college Google Sheet in one browser tab.</li>
                  <li>Edit an attendance row (for example, change absent count in <strong>CO-A</strong> on a recent date from 6 to 15).</li>
                  <li>Switch back to this dashboard.</li>
                  <li>
                    Click the <strong>&quot;Sync data&quot;</strong> button in the top right. It fires <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px] dark:bg-slate-700">fetch(API_URL + &quot;?refresh=1&quot;)</code>.
                  </li>
                  <li>
                    Notice that the KPI card for Total Absent, the Daily Trend line, and the Heatmap cell immediately update to reflect the new number, while your selected filters remain completely intact!
                  </li>
                </ol>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                3
              </span>
              <div>
                <strong className="text-slate-900 dark:text-slate-100">
                  Automatic background poll test:
                </strong>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Leave this dashboard tab open. Without clicking any buttons, the dashboard automatically executes a silent background poll every <strong>120 seconds</strong> (when the tab is active).
                  When it completes, the <strong>&quot;Last synced: HH:MM:SS&quot;</strong> timer updates, bringing any new sheet changes without refreshing the page.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                4
              </span>
              <div>
                <strong className="text-slate-900 dark:text-slate-100">
                  Browser DevTools verification:
                </strong>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Press <strong>F12</strong> &rarr; open the <strong>Network</strong> tab. Filter by <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px] dark:bg-slate-700">exec</code>.
                  Click &quot;Sync data&quot; to see the HTTP 200 GET request with <code className="font-mono text-[11px]">?refresh=1</code> return fresh JSON.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <Clock className="h-3.5 w-3.5 text-[#3b6fe0]" />
              <span>Current sync timestamp: {lastSyncedTime || "--:--:--"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3b6fe0] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2f5ec4] disabled:opacity-60 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Test force sync now (?refresh=1)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

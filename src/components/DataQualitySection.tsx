import React, { useState } from "react";
import { ChevronDown, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { AttendanceRecord } from "../types";
import { formatDateIndian } from "../utils/dateUtils";

interface DataQualitySectionProps {
  totalRecords: number;
  verifiedRecords: number;
  unverifiedRecords: number;
  verifiedPercentage: number;
  byProgram: Array<{
    program: string;
    total: number;
    verified: number;
    unverified: number;
    percentage: number;
  }>;
  warnings: string[];
  recordsWithNotes: AttendanceRecord[];
}

export const DataQualitySection: React.FC<DataQualitySectionProps> = ({
  totalRecords,
  verifiedRecords,
  unverifiedRecords,
  verifiedPercentage,
  byProgram,
  warnings,
  recordsWithNotes,
}) => {
  const [warningsOpen, setWarningsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <section
      id="data-quality"
      aria-label="Data quality and sheet warnings"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 space-y-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Data quality
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Roll list verification coverage and automated sheet validation warnings
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span>
            <strong>{verifiedPercentage.toFixed(1)}%</strong> verified roll lists ({verifiedRecords} of {totalRecords} filtered rows)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <th scope="col" className="px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Program
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Filtered rows
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Verified (rollsOk = true)
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Inconsistent / missing
              </th>
              <th scope="col" className="px-3.5 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                Verification rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {byProgram.map((item) => (
              <tr key={item.program} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-3.5 py-2 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {item.program}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {item.total}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  {item.verified}
                </td>
                <td className="px-3.5 py-2 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  {item.unverified}
                </td>
                <td className="px-3.5 py-2 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {item.total > 0 ? `${item.percentage.toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/70 font-semibold dark:border-slate-800 dark:bg-slate-800/40">
              <td className="px-3.5 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Filtered total
              </td>
              <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {totalRecords}
              </td>
              <td className="px-3.5 py-2 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                {verifiedRecords}
              </td>
              <td className="px-3.5 py-2 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400 whitespace-nowrap">
                {unverifiedRecords}
              </td>
              <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {verifiedPercentage.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setWarningsOpen((prev) => !prev)}
          aria-expanded={warningsOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>Sheet data-entry warnings ({warnings.length})</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span>{warningsOpen ? "Hide list" : "Show list"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${warningsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
        </button>

        {warningsOpen && (
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            {warnings.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No sheet warnings reported by the API.</p>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300">
                {warnings.map((warn, index) => (
                  <li key={`${index}-${warn}`} className="rounded border border-slate-100 bg-slate-50/70 px-3 py-1.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                    {warn}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {recordsWithNotes.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setNotesOpen((prev) => !prev)}
            aria-expanded={notesOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-200 dark:hover:bg-slate-800/60"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
              <span>Teacher notes in filtered records ({recordsWithNotes.length})</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span>{notesOpen ? "Hide notes" : "Show notes"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </span>
          </button>

          {notesOpen && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {recordsWithNotes.map((rec, idx) => (
                  <li
                    key={`${rec.date}-${rec.program}-${rec.semester}-${rec.type}-${idx}`}
                    className="flex flex-col gap-0.5 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0 dark:border-slate-800"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-mono tabular-nums">{formatDateIndian(rec.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{rec.program}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.semester} semester</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{rec.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Count: {rec.count}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{rec.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

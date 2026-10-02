import React, { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { LeaderboardRow } from "../types";

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
}

type SortKey =
  | "program"
  | "absent"
  | "late"
  | "bunk"
  | "activeDays"
  | "avgAbsentPerDay";

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ rows }) => {
  const [sortKey, setSortKey] = useState<SortKey>("absent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "program" ? "asc" : "desc");
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "program") {
        cmp = a.program.localeCompare(b.program);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      if (cmp === 0) {
        cmp = a.program.localeCompare(b.program);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const totals = useMemo(() => {
    let absent = 0;
    let late = 0;
    let bunk = 0;
    for (const r of rows) {
      absent += r.absent;
      late += r.late;
      bunk += r.bunk;
    }
    return { absent, late, bunk };
  }, [rows]);

  const columns: Array<{
    key: SortKey;
    label: string;
    align: "left" | "right";
  }> = [
    { key: "program", label: "Program", align: "left" },
    { key: "absent", label: "Absent", align: "right" },
    { key: "late", label: "Late", align: "right" },
    { key: "bunk", label: "Bunk", align: "right" },
    { key: "activeDays", label: "Active days", align: "right" },
    { key: "avgAbsentPerDay", label: "Average absent per day", align: "right" },
  ];

  return (
    <section
      id="leaderboard"
      aria-label="Program leaderboard"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Program leaderboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any column header to sort programs by attendance metrics
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          {rows.length} {rows.length === 1 ? "program" : "programs"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              {columns.map((col) => {
                const isActive = sortKey === col.key;
                const ariaSort = isActive
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap ${
                      col.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:text-white ${
                        col.align === "right" ? "ml-auto" : ""
                      }`}
                    >
                      <span>{col.label}</span>
                      {isActive ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[#3b6fe0] shrink-0" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-[#3b6fe0] shrink-0" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedRows.map((row) => (
              <tr
                key={row.program}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.program}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {row.absent.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {row.late.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {row.bunk.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {row.activeDays.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.avgAbsentPerDay.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/70 font-semibold dark:border-slate-800 dark:bg-slate-800/40">
              <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Total ({sortedRows.length} {sortedRows.length === 1 ? "program" : "programs"})
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {totals.absent.toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {totals.late.toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {totals.bunk.toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                —
              </td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-400 whitespace-nowrap">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

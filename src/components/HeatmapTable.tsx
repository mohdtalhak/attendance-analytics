import React, { useState } from "react";
import { HeatmapCellData, HeatmapMatrix } from "../types";
import { formatDateIndian, formatDateShortIndian } from "../utils/dateUtils";

interface HeatmapTableProps {
  heatmap: HeatmapMatrix;
}

function getHeatmapCellClass(
  absent: number,
  maxAbsent: number,
  isActiveDay: boolean
): string {
  if (!isActiveDay && absent === 0) {
    return "bg-slate-100/70 text-slate-400 dark:bg-slate-800/40 dark:text-slate-600";
  }
  if (absent <= 0 || maxAbsent <= 0) {
    return "bg-slate-50 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400";
  }

  const ratio = absent / maxAbsent;
  if (ratio <= 0.2) {
    return "bg-[#3b6fe0]/15 text-slate-900 dark:bg-[#3b6fe0]/25 dark:text-slate-100";
  }
  if (ratio <= 0.4) {
    return "bg-[#3b6fe0]/30 text-slate-900 dark:bg-[#3b6fe0]/40 dark:text-white";
  }
  if (ratio <= 0.6) {
    return "bg-[#3b6fe0]/50 text-slate-900 dark:bg-[#3b6fe0]/60 dark:text-white";
  }
  if (ratio <= 0.8) {
    return "bg-[#3b6fe0]/75 text-white dark:bg-[#3b6fe0]/80 dark:text-white";
  }
  return "bg-[#3b6fe0] text-white font-semibold";
}

export const HeatmapTable: React.FC<HeatmapTableProps> = ({ heatmap }) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);

  return (
    <article
      aria-label="Program by date absence heatmap"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Absence intensity heatmap
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Programs as rows and active dates (DD/MM/YYYY) as columns. Cell color intensity represents absent count.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Low (0)</span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="h-3.5 w-3.5 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span className="h-3.5 w-3.5 rounded-xs bg-[#3b6fe0]/15 dark:bg-[#3b6fe0]/25" />
            <span className="h-3.5 w-3.5 rounded-xs bg-[#3b6fe0]/30 dark:bg-[#3b6fe0]/40" />
            <span className="h-3.5 w-3.5 rounded-xs bg-[#3b6fe0]/50 dark:bg-[#3b6fe0]/60" />
            <span className="h-3.5 w-3.5 rounded-xs bg-[#3b6fe0]/75 dark:bg-[#3b6fe0]/80" />
            <span className="h-3.5 w-3.5 rounded-xs bg-[#3b6fe0]" />
          </div>
          <span className="font-mono tabular-nums">
            High ({heatmap.maxAbsent})
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
              <th
                scope="col"
                className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 whitespace-nowrap"
              >
                Program
              </th>
              {heatmap.dates.map((date) => (
                <th
                  key={date}
                  scope="col"
                  title={formatDateIndian(date)}
                  className="min-w-[60px] px-2 py-2 text-center font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap"
                >
                  <div>{formatDateShortIndian(date)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {date.slice(0, 4)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {heatmap.programs.map((prog) => (
              <tr key={prog} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3.5 py-2.5 font-mono font-semibold text-slate-900 group-hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:group-hover:bg-slate-800/80 whitespace-nowrap"
                >
                  {prog}
                </th>
                {heatmap.dates.map((date) => {
                  const cell = heatmap.cells[prog]?.[date];
                  if (!cell) return <td key={date} className="p-2" />;

                  const cellClass = getHeatmapCellClass(
                    cell.absent,
                    heatmap.maxAbsent,
                    cell.isActiveDay
                  );
                  const formattedDate = formatDateIndian(date);
                  const noteSuffix =
                    cell.notes.length > 0 ? ` | Note: ${cell.notes.join("; ")}` : "";
                  const tooltip =
                    cell.isActiveDay || cell.absent > 0 || cell.late > 0 || cell.bunk > 0
                      ? `${prog} on ${formattedDate} — Absent: ${cell.absent}, Late: ${cell.late}, Bunk: ${cell.bunk}${noteSuffix}`
                      : `${prog} on ${formattedDate} — No active session recorded`;

                  return (
                    <td key={date} className="p-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => setSelectedCell(cell)}
                        title={tooltip}
                        aria-label={tooltip}
                        className={`relative flex h-9 w-full min-w-[48px] items-center justify-center rounded-md font-mono text-xs tabular-nums transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${cellClass}`}
                      >
                        <span>
                          {cell.isActiveDay || cell.absent > 0 ? cell.absent : "—"}
                        </span>
                        {cell.notes.length > 0 && (
                          <span
                            className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-500"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <div className="mt-3 flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-slate-700 dark:text-slate-200">
            <span className="font-mono font-semibold">{selectedCell.program}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatDateIndian(selectedCell.date)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Absent: <strong>{selectedCell.absent}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Late: <strong>{selectedCell.late}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Bunk: <strong>{selectedCell.bunk}</strong>
            </span>
            {selectedCell.notes.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Teacher note: {selectedCell.notes.join(" | ")}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedCell(null)}
            className="self-end text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 sm:self-auto whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}
    </article>
  );
};

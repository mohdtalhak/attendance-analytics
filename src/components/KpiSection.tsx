import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { KpiMetrics, MetricDelta } from "../types";
import { formatDateIndian } from "../utils/dateUtils";

interface KpiSectionProps {
  kpis: KpiMetrics;
}

interface DeltaIndicatorProps {
  delta: MetricDelta | null;
  isPeriodComparisonActive: boolean;
  daysLength: number;
  isDecimal?: boolean;
}

const DeltaIndicator: React.FC<DeltaIndicatorProps> = ({
  delta,
  isPeriodComparisonActive,
  daysLength,
  isDecimal = false,
}) => {
  if (!isPeriodComparisonActive || !delta) {
    return (
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Select a date range to compare with previous period
      </p>
    );
  }

  if (!delta.hasPreviousData) {
    return (
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        No active days in preceding {daysLength}-day period
      </p>
    );
  }

  const prevFormatted = isDecimal
    ? delta.previous.toFixed(1)
    : delta.previous.toLocaleString("en-IN");

  if (Math.abs(delta.diff) < 0.001) {
    return (
      <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
        <Minus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>No change vs prev {daysLength}d ({prevFormatted})</span>
      </div>
    );
  }

  const isUp = delta.diff > 0;
  const diffFormatted = isDecimal
    ? Math.abs(delta.diff).toFixed(1)
    : Math.abs(Math.round(delta.diff)).toLocaleString("en-IN");

  const pctText =
    delta.percentChange !== null
      ? `${Math.abs(delta.percentChange).toFixed(1)}%`
      : `${isUp ? "+" : "-"}${diffFormatted}`;

  return (
    <div
      className={`mt-2 flex items-center gap-1 text-xs font-medium font-mono tabular-nums ${
        isUp
          ? "text-rose-600 dark:text-rose-400"
          : "text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {isUp ? (
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDownRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isUp ? "Up" : "Down"} {pctText} vs prev {daysLength}d ({prevFormatted})
      </span>
    </div>
  );
};

export const KpiSection: React.FC<KpiSectionProps> = ({ kpis }) => {
  return (
    <section id="overview" aria-label="Key attendance indicators">
      {kpis.isPeriodComparisonActive && kpis.prevPeriodRange && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Period comparison active ({kpis.comparisonDaysLength} calendar days)
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            Comparing against {formatDateIndian(kpis.prevPeriodRange.from)} to{" "}
            {formatDateIndian(kpis.prevPeriodRange.to)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total absent */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total absent
              </h2>
              <span className="h-2.5 w-2.5 rounded-xs bg-[#3b6fe0] shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.totalAbsent.toLocaleString("en-IN")}
            </p>
          </div>
          <DeltaIndicator
            delta={kpis.absentDelta}
            isPeriodComparisonActive={kpis.isPeriodComparisonActive}
            daysLength={kpis.comparisonDaysLength}
          />
        </article>

        {/* Total late */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total late
              </h2>
              <span className="h-2.5 w-2.5 rounded-xs bg-[#e5484d] shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.totalLate.toLocaleString("en-IN")}
            </p>
          </div>
          <DeltaIndicator
            delta={kpis.lateDelta}
            isPeriodComparisonActive={kpis.isPeriodComparisonActive}
            daysLength={kpis.comparisonDaysLength}
          />
        </article>

        {/* Total bunk */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total bunk
              </h2>
              <span className="h-2.5 w-2.5 rounded-xs bg-[#f5a524] shrink-0" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.totalBunk.toLocaleString("en-IN")}
            </p>
          </div>
          <DeltaIndicator
            delta={kpis.bunkDelta}
            isPeriodComparisonActive={kpis.isPeriodComparisonActive}
            daysLength={kpis.comparisonDaysLength}
          />
        </article>

        {/* Average absences per active day */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Average absences / active day
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.avgAbsentPerActiveDay.toFixed(1)}
            </p>
          </div>
          {kpis.isPeriodComparisonActive && kpis.avgAbsentDelta ? (
            <DeltaIndicator
              delta={kpis.avgAbsentDelta}
              isPeriodComparisonActive={kpis.isPeriodComparisonActive}
              daysLength={kpis.comparisonDaysLength}
              isDecimal={true}
            />
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Across {kpis.activeDaysCount} active{" "}
              {kpis.activeDaysCount === 1 ? "day" : "days"}
            </p>
          )}
        </article>

        {/* Program with most absences */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Program with most absences
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.mostAbsentProgram ? kpis.mostAbsentProgram.program : "—"}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {kpis.mostAbsentProgram
              ? `${kpis.mostAbsentProgram.count.toLocaleString("en-IN")} total absences`
              : "No absences recorded"}
          </p>
        </article>

        {/* Day with most absences */}
        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Day with most absences
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {kpis.mostAbsentDay
                ? kpis.mostAbsentDay.count.toLocaleString("en-IN")
                : "—"}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {kpis.mostAbsentDay
              ? `Date: ${formatDateIndian(kpis.mostAbsentDay.date)}`
              : "No absences recorded"}
          </p>
        </article>
      </div>
    </section>
  );
};

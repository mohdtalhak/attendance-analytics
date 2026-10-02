import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import {
  CHART_COLORS,
  CumulativeTrendPoint,
  DailyTrendPoint,
  OutlierDayItem,
  ProgramComparisonItem,
  ProgramSemesterMatrixItem,
  SemesterBreakdownItem,
  WeekdayPatternItem,
} from "../types";

interface ChartsSectionProps {
  dailyTrend: DailyTrendPoint[];
  cumulativeTrend: CumulativeTrendPoint[];
  programComparison: ProgramComparisonItem[];
  programSemesterMatrix: ProgramSemesterMatrixItem[];
  semesterBreakdown: SemesterBreakdownItem[];
  weekdayPattern: WeekdayPatternItem[];
  outlierDays: OutlierDayItem[];
  totalAbsent: number;
  totalLate: number;
  totalBunk: number;
  isDark: boolean;
}

type ChartViewMode = "optionA" | "optionB" | "all";

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  dailyTrend,
  cumulativeTrend,
  programComparison,
  programSemesterMatrix,
  semesterBreakdown,
  weekdayPattern,
  outlierDays,
  totalAbsent,
  totalLate,
  totalBunk,
  isDark,
}) => {
  const [viewMode, setChartViewMode] = useState<ChartViewMode>("optionA");
  const [programBarMode, setProgramBarMode] = useState<"grouped" | "stacked">("grouped");
  const [semesterBarMode, setSemesterBarMode] = useState<"grouped" | "stacked">("grouped");

  // Canvas refs for Option A
  const trendCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const programCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const semesterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const weekdayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas refs for Option B
  const donutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cumulativeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outlierCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(15, 23, 42, 0.08)";
  const tooltipBg = isDark ? "#0f172a" : "#1e293b";

  const showOptionA = viewMode === "optionA" || viewMode === "all";
  const showOptionB = viewMode === "optionB" || viewMode === "all";

  // Worst weekday helper
  const worstWeekday = React.useMemo(() => {
    let worst: WeekdayPatternItem | null = null;
    for (const item of weekdayPattern) {
      if (item.absent > 0 && (!worst || item.absent > worst.absent)) {
        worst = item;
      }
    }
    return worst;
  }, [weekdayPattern]);

  // Surge days helper
  const surgeDaysCount = React.useMemo(
    () => outlierDays.filter((d) => d.isSurge).length,
    [outlierDays]
  );

  // 1. Option A: Daily Trend
  useEffect(() => {
    if (!showOptionA) return;
    const canvas = trendCanvasRef.current;
    if (!canvas) return;

    const useShortLabels = dailyTrend.length > 10;
    const labels = dailyTrend.map((d) =>
      useShortLabels ? d.shortLabel : d.label
    );

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Absent",
            data: dailyTrend.map((d) => d.absent),
            borderColor: CHART_COLORS.absent,
            backgroundColor: "rgba(59, 111, 224, 0.14)",
            borderWidth: 2.25,
            pointRadius: dailyTrend.length > 35 ? 2 : 3.5,
            pointHoverRadius: 5,
            tension: 0.25,
            fill: true,
          },
          {
            label: "Late",
            data: dailyTrend.map((d) => d.late),
            borderColor: CHART_COLORS.late,
            backgroundColor: "rgba(229, 72, 77, 0.08)",
            borderWidth: 2,
            pointRadius: dailyTrend.length > 35 ? 2 : 3,
            pointHoverRadius: 5,
            tension: 0.25,
            fill: false,
          },
          {
            label: "Bunk",
            data: dailyTrend.map((d) => d.bunk),
            borderColor: CHART_COLORS.bunk,
            backgroundColor: "rgba(245, 165, 36, 0.08)",
            borderWidth: 2,
            pointRadius: dailyTrend.length > 35 ? 2 : 3,
            pointHoverRadius: 5,
            tension: 0.25,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: textColor,
              usePointStyle: true,
              boxWidth: 8,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 500 },
            },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                if (!items.length) return "";
                const idx = items[0].dataIndex;
                const pt = dailyTrend[idx];
                return pt ? `Date: ${pt.label}` : items[0].label;
              },
              footer: (items) => {
                if (!items.length) return "";
                const idx = items[0].dataIndex;
                const pt = dailyTrend[idx];
                if (!pt || !pt.notes || pt.notes.length === 0) return "";
                return pt.notes.map(
                  (n) => `Note (${n.program} ${n.semester}): ${n.note}`
                );
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 12,
              font: { family: "'JetBrains Mono', monospace", size: 11 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              precision: 0,
              font: { family: "'JetBrains Mono', monospace", size: 11 },
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionA, dailyTrend, isDark, textColor, gridColor, tooltipBg]);

  // 2. Option A: Program Comparison Bar
  useEffect(() => {
    if (!showOptionA) return;
    const canvas = programCanvasRef.current;
    if (!canvas) return;

    const isStacked = programBarMode === "stacked";

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: programComparison.map((p) => p.program),
        datasets: [
          {
            label: "Absent",
            data: programComparison.map((p) => p.absent),
            backgroundColor: CHART_COLORS.absent,
            borderRadius: 4,
          },
          {
            label: "Late",
            data: programComparison.map((p) => p.late),
            backgroundColor: CHART_COLORS.late,
            borderRadius: 4,
          },
          {
            label: "Bunk",
            data: programComparison.map((p) => p.bunk),
            backgroundColor: CHART_COLORS.bunk,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: textColor,
              usePointStyle: true,
              boxWidth: 8,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 500 },
            },
          },
          tooltip: { backgroundColor: tooltipBg, padding: 10, cornerRadius: 8 },
        },
        scales: {
          x: {
            stacked: isStacked,
            grid: { display: false },
            ticks: { color: textColor, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
          y: {
            stacked: isStacked,
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionA, programComparison, programBarMode, isDark, textColor, gridColor, tooltipBg]);

  // 3. Option A: Semester Breakdown Bar
  useEffect(() => {
    if (!showOptionA) return;
    const canvas = semesterCanvasRef.current;
    if (!canvas) return;

    const isStacked = semesterBarMode === "stacked";

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: semesterBreakdown.map((s) => `${s.semester} semester`),
        datasets: [
          {
            label: "Absent",
            data: semesterBreakdown.map((s) => s.absent),
            backgroundColor: CHART_COLORS.absent,
            borderRadius: 4,
          },
          {
            label: "Late",
            data: semesterBreakdown.map((s) => s.late),
            backgroundColor: CHART_COLORS.late,
            borderRadius: 4,
          },
          {
            label: "Bunk",
            data: semesterBreakdown.map((s) => s.bunk),
            backgroundColor: CHART_COLORS.bunk,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: textColor,
              usePointStyle: true,
              boxWidth: 8,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 500 },
            },
          },
          tooltip: { backgroundColor: tooltipBg, padding: 10, cornerRadius: 8 },
        },
        scales: {
          x: {
            stacked: isStacked,
            grid: { display: false },
            ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
          },
          y: {
            stacked: isStacked,
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionA, semesterBreakdown, semesterBarMode, isDark, textColor, gridColor, tooltipBg]);

  // 4. Option A: Weekday Pattern Bar
  useEffect(() => {
    if (!showOptionA) return;
    const canvas = weekdayCanvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: weekdayPattern.map((w) => w.shortName),
        datasets: [
          {
            label: "Absent",
            data: weekdayPattern.map((w) => w.absent),
            backgroundColor: CHART_COLORS.absent,
            borderRadius: 4,
          },
          {
            label: "Late",
            data: weekdayPattern.map((w) => w.late),
            backgroundColor: CHART_COLORS.late,
            borderRadius: 4,
          },
          {
            label: "Bunk",
            data: weekdayPattern.map((w) => w.bunk),
            backgroundColor: CHART_COLORS.bunk,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              color: textColor,
              usePointStyle: true,
              boxWidth: 8,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 500 },
            },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                if (!items.length) return "";
                const idx = items[0].dataIndex;
                return weekdayPattern[idx]?.dayName || items[0].label;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionA, weekdayPattern, isDark, textColor, gridColor, tooltipBg]);

  // 5. Option B: Type Composition Donut Chart
  useEffect(() => {
    if (!showOptionB) return;
    const canvas = donutCanvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Absent", "Late", "Bunk"],
        datasets: [
          {
            data: [totalAbsent, totalLate, totalBunk],
            backgroundColor: [CHART_COLORS.absent, CHART_COLORS.late, CHART_COLORS.bunk],
            borderWidth: 2,
            borderColor: isDark ? "#0f172a" : "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            padding: 10,
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = Number(context.raw) || 0;
                const grandTotal = totalAbsent + totalLate + totalBunk;
                const pct = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : "0";
                return ` ${label}: ${value.toLocaleString("en-IN")} (${pct}%)`;
              },
            },
          },
        },
        cutout: "68%",
      },
    });

    return () => chart.destroy();
  }, [showOptionB, totalAbsent, totalLate, totalBunk, isDark, textColor, tooltipBg]);

  // 6. Option B: Cumulative Progression Area Chart
  useEffect(() => {
    if (!showOptionB) return;
    const canvas = cumulativeCanvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: cumulativeTrend.map((c) => c.shortLabel),
        datasets: [
          {
            label: "Cumulative Total Deficit",
            data: cumulativeTrend.map((c) => c.cumulativeTotal),
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.12)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
          },
          {
            label: "Cumulative Absent",
            data: cumulativeTrend.map((c) => c.cumulativeAbsent),
            borderColor: CHART_COLORS.absent,
            borderWidth: 1.8,
            fill: false,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
          },
          tooltip: { backgroundColor: tooltipBg, padding: 10 },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, maxTicksLimit: 10, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionB, cumulativeTrend, isDark, textColor, gridColor, tooltipBg]);

  // 7. Option B: Program-by-Semester Cross-Matrix Stacked Chart
  useEffect(() => {
    if (!showOptionB) return;
    const canvas = matrixCanvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: programSemesterMatrix.map((p) => p.program),
        datasets: [
          {
            label: "First Semester",
            data: programSemesterMatrix.map((p) => p.first),
            backgroundColor: CHART_COLORS.firstSemester,
            borderRadius: 4,
          },
          {
            label: "Third Semester",
            data: programSemesterMatrix.map((p) => p.third),
            backgroundColor: CHART_COLORS.thirdSemester,
            borderRadius: 4,
          },
          {
            label: "Fifth Semester",
            data: programSemesterMatrix.map((p) => p.fifth),
            backgroundColor: CHART_COLORS.fifthSemester,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
          },
          tooltip: { backgroundColor: tooltipBg, padding: 10 },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, precision: 0, font: { family: "'JetBrains Mono', monospace", size: 11 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionB, programSemesterMatrix, isDark, textColor, gridColor, tooltipBg]);

  // 8. Option B: Outlier & Surge Spike Analyzer
  useEffect(() => {
    if (!showOptionB) return;
    const canvas = outlierCanvasRef.current;
    if (!canvas) return;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: outlierDays.map((d) => d.label),
        datasets: [
          {
            label: "Daily Absences",
            data: outlierDays.map((d) => d.absent),
            backgroundColor: outlierDays.map((d) =>
              d.isSurge ? "#e5484d" : "rgba(59, 111, 224, 0.75)"
            ),
            borderRadius: 4,
          },
          {
            type: "line",
            label: "Baseline Average",
            data: outlierDays.map((d) => d.average),
            borderColor: isDark ? "#94a3b8" : "#64748b",
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            callbacks: {
              footer: (items) => {
                if (!items.length) return "";
                const idx = items[0].dataIndex;
                const item = outlierDays[idx];
                return item?.isSurge ? "Surge Alert: >40% above term average" : "";
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              maxTicksLimit: 12,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: "'JetBrains Mono', monospace", size: 10 } },
          },
        },
      },
    });

    return () => chart.destroy();
  }, [showOptionB, outlierDays, isDark, textColor, gridColor, tooltipBg]);

  return (
    <section id="charts" aria-label="Attendance visualizations" className="space-y-6">
      {/* Chart View Switcher Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Interactive Visualizations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between core trends (Option A) and distribution diagnostics (Option B)
          </p>
        </div>

        {/* Option A vs Option B segmented control */}
        <div
          role="group"
          aria-label="Chart view option selector"
          className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-medium"
        >
          <button
            type="button"
            onClick={() => setChartViewMode("optionA")}
            aria-pressed={viewMode === "optionA"}
            className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
              viewMode === "optionA"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Option A: Trends & Breakdown
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode("optionB")}
            aria-pressed={viewMode === "optionB"}
            className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
              viewMode === "optionB"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Option B: Distributions & Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setChartViewMode("all")}
            aria-pressed={viewMode === "all"}
            className={`rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
              viewMode === "all"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100 font-semibold"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Both Options (All 8 Charts)
          </button>
        </div>
      </div>

      {/* OPTION A SECTION */}
      {showOptionA && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#3b6fe0]">
              Option A: Time Trends & Comparisons
            </span>
          </div>

          {/* 1. Daily Trend Line Chart */}
          <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Daily attendance trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Absent, late, and bunk counts across active college days (weekends and holidays excluded)
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {dailyTrend.length} active {dailyTrend.length === 1 ? "day" : "days"} plotted
              </div>
            </div>
            <div className="relative h-72 w-full sm:h-80">
              <canvas ref={trendCanvasRef} aria-label="Daily trend line chart" role="img" />
            </div>
          </article>

          {/* 2-column grid for Program, Semester, Weekday */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 2. Program Comparison Bar Chart */}
            <article className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Program comparison
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Total records by program
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Program chart bar layout"
                  className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setProgramBarMode("grouped")}
                    aria-pressed={programBarMode === "grouped"}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      programBarMode === "grouped"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    Grouped
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramBarMode("stacked")}
                    aria-pressed={programBarMode === "stacked"}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      programBarMode === "stacked"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    Stacked
                  </button>
                </div>
              </div>
              <div className="relative h-64 w-full sm:h-72">
                <canvas ref={programCanvasRef} aria-label="Program comparison bar chart" role="img" />
              </div>
            </article>

            {/* 3. Semester Breakdown Bar Chart */}
            <article className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Semester breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    First, Third, and Fifth
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Semester chart bar layout"
                  className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setSemesterBarMode("grouped")}
                    aria-pressed={semesterBarMode === "grouped"}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      semesterBarMode === "grouped"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    Grouped
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemesterBarMode("stacked")}
                    aria-pressed={semesterBarMode === "stacked"}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                      semesterBarMode === "stacked"
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    }`}
                  >
                    Stacked
                  </button>
                </div>
              </div>
              <div className="relative h-64 w-full sm:h-72">
                <canvas ref={semesterCanvasRef} aria-label="Semester breakdown bar chart" role="img" />
              </div>
            </article>

            {/* 4. Weekday Pattern Bar Chart */}
            <article className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Weekday pattern (Mon to Sat)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {worstWeekday
                      ? `Highest absences: ${worstWeekday.dayName} (${worstWeekday.absent.toLocaleString("en-IN")})`
                      : "Cumulative totals by day of week"}
                  </p>
                </div>
              </div>
              <div className="relative h-64 w-full sm:h-72">
                <canvas ref={weekdayCanvasRef} aria-label="Weekday pattern bar chart" role="img" />
              </div>
            </article>
          </div>
        </div>
      )}

      {/* OPTION B SECTION (NEW CHARTS) */}
      {showOptionB && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Option B: Distributions & Diagnostic Analytics
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 5. Type Composition Donut */}
            <article className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Attendance composition
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Relative share of Absent vs Late vs Bunk
                </p>
              </div>
              <div className="relative h-64 w-full">
                <canvas ref={donutCanvasRef} aria-label="Attendance type composition donut chart" role="img" />
              </div>
            </article>

            {/* 6. Cumulative Deficit Area Chart */}
            <article className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Cumulative attendance deficit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Running sum of absences and disciplinary flags over the semester
                  </p>
                </div>
              </div>
              <div className="relative h-64 w-full">
                <canvas ref={cumulativeCanvasRef} aria-label="Cumulative attendance area chart" role="img" />
              </div>
            </article>

            {/* 7. Program-by-Semester Cross-Matrix Chart */}
            <article className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Program & semester cross-matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semester distribution within each individual department
                </p>
              </div>
              <div className="relative h-64 w-full sm:h-72">
                <canvas ref={matrixCanvasRef} aria-label="Program semester cross matrix chart" role="img" />
              </div>
            </article>

            {/* 8. Outlier & Surge Spike Analyzer */}
            <article className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Daily outlier & surge analyzer
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Surge days marked in red (&gt;40% above term average)
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-rose-600 dark:text-rose-400">
                  {surgeDaysCount} surge {surgeDaysCount === 1 ? "day" : "days"} detected
                </span>
              </div>
              <div className="relative h-64 w-full sm:h-72">
                <canvas ref={outlierCanvasRef} aria-label="Outlier spike analyzer chart" role="img" />
              </div>
            </article>
          </div>
        </div>
      )}
    </section>
  );
};

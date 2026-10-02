import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, ChevronDown, Check } from "lucide-react";
import {
  DatePreset,
  FilterState,
  SemesterFilter,
  TypeFilter,
} from "../types";
import { formatDateIndian } from "../utils/dateUtils";

interface FilterBarProps {
  allPrograms: string[];
  allDates: string[];
  filters: FilterState;
  onToggleProgram: (program: string) => void;
  onSelectAllPrograms: () => void;
  onChangeSemester: (semester: SemesterFilter) => void;
  onChangeType: (type: TypeFilter) => void;
  onChangeDateRange: (from: string, to: string) => void;
  onSelectDatePreset: (preset: DatePreset) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  allPrograms,
  allDates,
  filters,
  onToggleProgram,
  onSelectAllPrograms,
  onChangeSemester,
  onChangeType,
  onChangeDateRange,
  onSelectDatePreset,
  onResetFilters,
  hasActiveFilters,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minDate = allDates[0] || "";
  const maxDate = allDates[allDates.length - 1] || "";

  const isAllPrograms =
    filters.programs.length === 0 ||
    filters.programs.length === allPrograms.length;

  const programSummaryLabel = isAllPrograms
    ? "All programs"
    : filters.programs.length === 1
    ? filters.programs[0]
    : `${filters.programs.length} programs selected`;

  const semesterOptions: Array<{ value: SemesterFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "First", label: "First" },
    { value: "Third", label: "Third" },
    { value: "Fifth", label: "Fifth" },
  ];

  const typeOptions: Array<{ value: TypeFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "bunk", label: "Bunk" },
  ];

  const presetOptions: Array<{ value: DatePreset; label: string }> = [
    { value: "last7", label: "Last 7 days" },
    { value: "last30", label: "Last 30 days" },
    { value: "thisMonth", label: "This month" },
    { value: "allTime", label: "All time" },
  ];

  return (
    <section
      aria-label="Attendance filters"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4">
        {/* Top row: Program multi-select, Semester, Type */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
          <div className="md:col-span-5" ref={dropdownRef}>
            <label
              id="program-filter-label"
              htmlFor="program-dropdown-trigger"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Program
            </label>
            <div className="relative">
              <button
                id="program-dropdown-trigger"
                type="button"
                aria-labelledby="program-filter-label"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-left text-sm font-medium text-slate-900 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600"
              >
                <span className="truncate">{programSummaryLabel}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  aria-labelledby="program-filter-label"
                  className="absolute left-0 z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isAllPrograms}
                    onClick={() => onSelectAllPrograms()}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isAllPrograms
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <span>All programs</span>
                    {isAllPrograms && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                  {allPrograms.map((prog) => {
                    const selected =
                      !isAllPrograms && filters.programs.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => onToggleProgram(prog)}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors ${
                          selected
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <span className="font-mono">{prog}</span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <span
              id="semester-filter-label"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Semester
            </span>
            <div
              role="group"
              aria-labelledby="semester-filter-label"
              className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            >
              {semesterOptions.map((opt) => {
                const active = filters.semester === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeSemester(opt.value)}
                    aria-pressed={active}
                    className={`h-8 rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                      active
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-4">
            <span
              id="type-filter-label"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Type
            </span>
            <div
              role="group"
              aria-labelledby="type-filter-label"
              className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
            >
              {typeOptions.map((opt) => {
                const active = filters.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeType(opt.value)}
                    aria-pressed={active}
                    className={`h-8 rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                      active
                        ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick program select */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
            Quick select:
          </span>
          <button
            type="button"
            onClick={onSelectAllPrograms}
            aria-pressed={isAllPrograms}
            className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
              isAllPrograms
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All programs
          </button>
          {allPrograms.map((prog) => {
            const active = !isAllPrograms && filters.programs.includes(prog);
            return (
              <button
                key={prog}
                type="button"
                onClick={() => onToggleProgram(prog)}
                aria-pressed={active}
                className={`h-7 rounded-md px-2.5 text-xs font-mono font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  active
                    ? "bg-[#3b6fe0] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {prog}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Date range pickers + Quick range + Reset */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label
                htmlFor="filter-date-from"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                From date{" "}
                <span className="font-normal text-slate-500 dark:text-slate-400 font-mono">
                  ({formatDateIndian(filters.dateFrom)})
                </span>
              </label>
              <input
                id="filter-date-from"
                type="date"
                min={minDate}
                max={filters.dateTo || maxDate}
                value={filters.dateFrom}
                onChange={(e) =>
                  onChangeDateRange(e.target.value, filters.dateTo)
                }
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-mono tabular-nums text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="filter-date-to"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                To date{" "}
                <span className="font-normal text-slate-500 dark:text-slate-400 font-mono">
                  ({formatDateIndian(filters.dateTo)})
                </span>
              </label>
              <input
                id="filter-date-to"
                type="date"
                min={filters.dateFrom || minDate}
                max={maxDate}
                value={filters.dateTo}
                onChange={(e) =>
                  onChangeDateRange(filters.dateFrom, e.target.value)
                }
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-mono tabular-nums text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <span
                id="date-preset-label"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Quick range
              </span>
              <div
                role="group"
                aria-labelledby="date-preset-label"
                className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
              >
                {presetOptions.map((preset) => {
                  const active = filters.datePreset === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => onSelectDatePreset(preset.value)}
                      aria-pressed={active}
                      className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                        active
                          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Reset filters</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

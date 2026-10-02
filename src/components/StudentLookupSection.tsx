import React, { useEffect, useMemo, useState } from "react";
import { Search, Info } from "lucide-react";
import { AttendanceRecord, FilterState } from "../types";
import {
  computeStudentLookup,
  computeTopAbsentRolls,
} from "../utils/analytics";
import { formatDateIndian } from "../utils/dateUtils";

interface StudentLookupSectionProps {
  allPrograms: string[];
  allRecords: AttendanceRecord[];
  filters: FilterState;
}

function formatTypeLabel(type: string): string {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getTypeTextClass(type: string): string {
  if (type === "absent") {
    return "text-[#3b6fe0] dark:text-blue-400 font-semibold";
  }
  if (type === "late") {
    return "text-[#e5484d] dark:text-rose-400 font-semibold";
  }
  if (type === "bunk") {
    return "text-[#d97706] dark:text-[#f5a524] font-semibold";
  }
  return "text-slate-700 dark:text-slate-300 font-medium";
}

export const StudentLookupSection: React.FC<StudentLookupSectionProps> = ({
  allPrograms,
  allRecords,
  filters,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<string>(
    allPrograms[0] || "CO-A"
  );
  const [rollInput, setRollInput] = useState<string>("");

  useEffect(() => {
    if (filters.programs.length === 1) {
      setSelectedProgram(filters.programs[0]);
    } else if (
      allPrograms.length > 0 &&
      !allPrograms.includes(selectedProgram)
    ) {
      setSelectedProgram(allPrograms[0]);
    }
  }, [filters.programs, allPrograms, selectedProgram]);

  const parsedRoll = useMemo(() => {
    const trimmed = rollInput.trim();
    if (!trimmed) return null;
    const num = Number.parseInt(trimmed, 10);
    return Number.isNaN(num) || num <= 0 ? null : num;
  }, [rollInput]);

  const lookupResult = useMemo(
    () =>
      computeStudentLookup(allRecords, selectedProgram, parsedRoll, filters),
    [allRecords, selectedProgram, parsedRoll, filters]
  );

  const topAbsentData = useMemo(
    () => computeTopAbsentRolls(allRecords, selectedProgram, filters, 10),
    [allRecords, selectedProgram, filters]
  );

  return (
    <section
      id="student-lookup"
      aria-label="Student attendance lookup and frequent absences"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Student lookup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect verified roll-number attendance records by program and view the most frequently absent roll numbers
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[#3b6fe0]"
          aria-hidden="true"
        />
        <p className="leading-relaxed">
          Based on{" "}
          <strong className="font-mono tabular-nums font-semibold">
            {lookupResult.verifiedProgramRecordsCount}
          </strong>{" "}
          verified entries. Roll lists are missing or inconsistent for the rest,
          so real numbers may be higher.
          {lookupResult.totalProgramRecordsCount > 0 && (
            <span className="text-slate-500 dark:text-slate-400">
              {" "}
              ({lookupResult.verifiedProgramRecordsCount} of{" "}
              {lookupResult.totalProgramRecordsCount} filtered rows for{" "}
              {selectedProgram} have verified roll lists.)
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Roll lookup form & timeline */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
            <div className="sm:col-span-5">
              <label
                htmlFor="student-lookup-program"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Program (required)
              </label>
              <select
                id="student-lookup-program"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {allPrograms.map((prog) => (
                  <option key={prog} value={prog}>
                    {prog}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="student-lookup-roll"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Roll number
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="student-lookup-roll"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  placeholder="Enter roll no. (e.g. 18)"
                  value={rollInput}
                  onChange={(e) => setRollInput(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setRollInput("")}
                disabled={!rollInput}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          {parsedRoll === null ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enter a roll number above or select a student from the table on the right
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Roll numbers repeat across programs, so results are scoped to{" "}
                <span className="font-mono font-semibold">{selectedProgram}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Verified absent
                  </div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#3b6fe0] dark:text-blue-400">
                    {lookupResult.absent}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Verified late
                  </div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#e5484d] dark:text-rose-400">
                    {lookupResult.late}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Verified bunk
                  </div>
                  <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#d97706] dark:text-[#f5a524]">
                    {lookupResult.bunk}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Attendance timeline for {selectedProgram} Roll #{parsedRoll}{" "}
                    (newest first)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {lookupResult.timeline.length}{" "}
                    {lookupResult.timeline.length === 1 ? "entry" : "entries"}
                  </span>
                </div>

                {lookupResult.timeline.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    No verified absent, late, or bunk entries found for Roll #
                    {parsedRoll} in {selectedProgram} under current filters.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800">
                        <tr>
                          <th scope="col" className="px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Date
                          </th>
                          <th scope="col" className="px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Semester
                          </th>
                          <th scope="col" className="px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            Type
                          </th>
                          <th scope="col" className="px-3.5 py-2.5 font-semibold text-slate-700 dark:text-slate-200">
                            Teacher note
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {lookupResult.timeline.map((item, idx) => (
                          <tr
                            key={`${item.date}-${item.semester}-${item.type}-${idx}`}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-3.5 py-2.5 font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                              {formatDateIndian(item.date)}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {item.semester}
                            </td>
                            <td className={`px-3.5 py-2.5 whitespace-nowrap ${getTypeTextClass(item.type)}`}>
                              {formatTypeLabel(item.type)}
                            </td>
                            <td className="px-3.5 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                              {item.note ? item.note : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Most frequently absent roll numbers */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Most frequently absent roll numbers ({selectedProgram})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top 10 from verified entries only. Click any row to inspect.
              </p>
            </div>
          </div>

          {topAbsentData.entries.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No verified roll number records found for {selectedProgram} under the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                    <th scope="col" className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Roll no.
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Semester
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Absent
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Late
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      Bunk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {topAbsentData.entries.map((entry) => {
                    const isSelected = parsedRoll === entry.roll;
                    return (
                      <tr
                        key={entry.roll}
                        onClick={() => setRollInput(String(entry.roll))}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50/90 dark:bg-blue-950/50"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-3 py-2 font-mono font-semibold tabular-nums text-[#3b6fe0] dark:text-blue-400 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRollInput(String(entry.roll));
                            }}
                            className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                          >
                            Roll #{entry.roll}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {entry.semesters.join(", ")}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {entry.absent}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {entry.late}
                        </td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {entry.bunk}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

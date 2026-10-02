import {
  AttendanceApiSuccessResponse,
  AttendanceRecord,
  CumulativeTrendPoint,
  DailyTrendPoint,
  FilterState,
  FrequentRollEntry,
  HeatmapCellData,
  HeatmapMatrix,
  KpiMetrics,
  LeaderboardRow,
  MetricDelta,
  OutlierDayItem,
  ProgramComparisonItem,
  ProgramSemesterMatrixItem,
  SemesterBreakdownItem,
  StudentLookupSummary,
  StudentTimelineEntry,
  WeekdayPatternItem,
} from "../types";
import {
  computePreviousPeriodRange,
  formatDateIndian,
  formatDateShortIndian,
  parseDateLocal,
} from "./dateUtils";

export function getEffectivePrograms(
  allPrograms: string[],
  selectedPrograms: string[]
): string[] {
  if (!selectedPrograms || selectedPrograms.length === 0) {
    return allPrograms;
  }
  const selectedSet = new Set(selectedPrograms);
  return allPrograms.filter((p) => selectedSet.has(p));
}

export function getActiveDaysForPrograms(
  activeDaysMap: Record<string, string[]>,
  programs: string[],
  dateFrom: string,
  dateTo: string,
  fallbackDates: string[] = []
): string[] {
  const dateSet = new Set<string>();

  if (activeDaysMap && Object.keys(activeDaysMap).length > 0) {
    for (const prog of programs) {
      const days = activeDaysMap[prog];
      if (Array.isArray(days)) {
        for (const d of days) {
          if ((!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)) {
            dateSet.add(d);
          }
        }
      }
    }
  } else {
    for (const d of fallbackDates) {
      if ((!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)) {
        dateSet.add(d);
      }
    }
  }

  return Array.from(dateSet).sort();
}

export function filterRecords(
  records: AttendanceRecord[],
  effectivePrograms: string[],
  semester: FilterState["semester"],
  type: FilterState["type"],
  dateFrom: string,
  dateTo: string
): AttendanceRecord[] {
  const progSet = new Set(effectivePrograms);

  return records.filter((r) => {
    if (!progSet.has(r.program)) return false;
    if (semester !== "all" && r.semester !== semester) return false;
    if (type !== "all" && r.type !== type) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    return true;
  });
}

function buildMetricDelta(
  current: number,
  previous: number,
  hasPreviousData: boolean
): MetricDelta {
  const diff = current - previous;
  let percentChange: number | null = null;
  if (previous > 0) {
    percentChange = ((current - previous) / previous) * 100;
  } else if (previous === 0 && current === 0) {
    percentChange = 0;
  }
  return {
    current,
    previous,
    diff,
    percentChange,
    hasPreviousData,
  };
}

export function computeKpis(
  data: AttendanceApiSuccessResponse,
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[],
  activeDatesInRange: string[],
  filters: FilterState
): KpiMetrics {
  let totalAbsent = 0;
  let totalLate = 0;
  let totalBunk = 0;

  const absentByProgram = new Map<string, number>();
  const absentByDate = new Map<string, number>();

  for (const r of filteredRecords) {
    const count = Number(r.count) || 0;
    if (r.type === "absent") {
      totalAbsent += count;
      absentByProgram.set(r.program, (absentByProgram.get(r.program) || 0) + count);
      absentByDate.set(r.date, (absentByDate.get(r.date) || 0) + count);
    } else if (r.type === "late") {
      totalLate += count;
    } else if (r.type === "bunk") {
      totalBunk += count;
    }
  }

  let mostAbsentProgram: { program: string; count: number } | null = null;
  for (const [program, count] of absentByProgram.entries()) {
    if (
      count > 0 &&
      (!mostAbsentProgram ||
        count > mostAbsentProgram.count ||
        (count === mostAbsentProgram.count && program < mostAbsentProgram.program))
    ) {
      mostAbsentProgram = { program, count };
    }
  }

  let mostAbsentDay: { date: string; count: number } | null = null;
  for (const [date, count] of absentByDate.entries()) {
    if (
      count > 0 &&
      (!mostAbsentDay ||
        count > mostAbsentDay.count ||
        (count === mostAbsentDay.count && date > mostAbsentDay.date))
    ) {
      mostAbsentDay = { date, count };
    }
  }

  const activeDaysCount = activeDatesInRange.length;
  const avgAbsentPerActiveDay =
    activeDaysCount > 0 ? totalAbsent / activeDaysCount : 0;

  const allDates = data.dates || [];
  const minDatasetDate = allDates[0] || "";
  const maxDatasetDate = allDates[allDates.length - 1] || "";

  const isSubRange =
    Boolean(filters.dateFrom && filters.dateTo) &&
    (filters.datePreset !== "allTime" ||
      filters.dateFrom > minDatasetDate ||
      filters.dateTo < maxDatasetDate);

  let absentDelta: MetricDelta | null = null;
  let lateDelta: MetricDelta | null = null;
  let bunkDelta: MetricDelta | null = null;
  let avgAbsentDelta: MetricDelta | null = null;
  let comparisonDaysLength = 0;
  let prevPeriodRange: { from: string; to: string } | null = null;

  if (isSubRange) {
    const prevInfo = computePreviousPeriodRange(filters.dateFrom, filters.dateTo);
    if (prevInfo) {
      comparisonDaysLength = prevInfo.daysCount;
      prevPeriodRange = { from: prevInfo.prevFrom, to: prevInfo.prevTo };

      const prevActiveDates = getActiveDaysForPrograms(
        data.activeDays,
        effectivePrograms,
        prevInfo.prevFrom,
        prevInfo.prevTo,
        data.dates
      );
      const hasPreviousData = prevActiveDates.length > 0;

      const prevRecords = filterRecords(
        data.records,
        effectivePrograms,
        filters.semester,
        filters.type,
        prevInfo.prevFrom,
        prevInfo.prevTo
      );

      let prevAbsent = 0;
      let prevLate = 0;
      let prevBunk = 0;

      for (const r of prevRecords) {
        const count = Number(r.count) || 0;
        if (r.type === "absent") prevAbsent += count;
        else if (r.type === "late") prevLate += count;
        else if (r.type === "bunk") prevBunk += count;
      }

      const prevAvgAbsent =
        prevActiveDates.length > 0 ? prevAbsent / prevActiveDates.length : 0;

      absentDelta = buildMetricDelta(totalAbsent, prevAbsent, hasPreviousData);
      lateDelta = buildMetricDelta(totalLate, prevLate, hasPreviousData);
      bunkDelta = buildMetricDelta(totalBunk, prevBunk, hasPreviousData);
      avgAbsentDelta = buildMetricDelta(
        avgAbsentPerActiveDay,
        prevAvgAbsent,
        hasPreviousData
      );
    }
  }

  return {
    totalAbsent,
    totalLate,
    totalBunk,
    mostAbsentProgram,
    mostAbsentDay,
    activeDaysCount,
    avgAbsentPerActiveDay,
    isPeriodComparisonActive: isSubRange && prevPeriodRange !== null,
    comparisonDaysLength,
    prevPeriodRange,
    absentDelta,
    lateDelta,
    bunkDelta,
    avgAbsentDelta,
  };
}

export function computeDailyTrend(
  filteredRecords: AttendanceRecord[],
  activeDatesInRange: string[]
): DailyTrendPoint[] {
  const pointMap = new Map<string, DailyTrendPoint>();

  for (const date of activeDatesInRange) {
    pointMap.set(date, {
      date,
      label: formatDateIndian(date),
      shortLabel: formatDateShortIndian(date),
      absent: 0,
      late: 0,
      bunk: 0,
      notes: [],
    });
  }

  for (const r of filteredRecords) {
    let pt = pointMap.get(r.date);
    if (!pt) {
      pt = {
        date: r.date,
        label: formatDateIndian(r.date),
        shortLabel: formatDateShortIndian(r.date),
        absent: 0,
        late: 0,
        bunk: 0,
        notes: [],
      };
      pointMap.set(r.date, pt);
    }
    const count = Number(r.count) || 0;
    if (r.type === "absent") pt.absent += count;
    else if (r.type === "late") pt.late += count;
    else if (r.type === "bunk") pt.bunk += count;

    if (r.note && r.note.trim() !== "") {
      pt.notes.push({
        program: r.program,
        semester: r.semester,
        type: r.type,
        note: r.note.trim(),
      });
    }
  }

  return Array.from(pointMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function computeCumulativeTrend(
  dailyTrend: DailyTrendPoint[]
): CumulativeTrendPoint[] {
  let runningAbsent = 0;
  let runningLate = 0;
  let runningBunk = 0;

  return dailyTrend.map((pt) => {
    runningAbsent += pt.absent;
    runningLate += pt.late;
    runningBunk += pt.bunk;
    return {
      date: pt.date,
      label: pt.label,
      shortLabel: pt.shortLabel,
      cumulativeAbsent: runningAbsent,
      cumulativeLate: runningLate,
      cumulativeBunk: runningBunk,
      cumulativeTotal: runningAbsent + runningLate + runningBunk,
    };
  });
}

export function computeProgramComparison(
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[]
): ProgramComparisonItem[] {
  const map = new Map<string, ProgramComparisonItem>();
  for (const prog of effectivePrograms) {
    map.set(prog, { program: prog, absent: 0, late: 0, bunk: 0, total: 0 });
  }

  for (const r of filteredRecords) {
    const item = map.get(r.program);
    if (!item) continue;
    const count = Number(r.count) || 0;
    if (r.type === "absent") item.absent += count;
    else if (r.type === "late") item.late += count;
    else if (r.type === "bunk") item.bunk += count;
    item.total += count;
  }

  return Array.from(map.values());
}

export function computeProgramSemesterMatrix(
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[]
): ProgramSemesterMatrixItem[] {
  const map = new Map<string, ProgramSemesterMatrixItem>();
  for (const prog of effectivePrograms) {
    map.set(prog, { program: prog, first: 0, third: 0, fifth: 0, total: 0 });
  }

  for (const r of filteredRecords) {
    const item = map.get(r.program);
    if (!item) continue;
    const count = Number(r.count) || 0;
    if (r.semester === "First") item.first += count;
    else if (r.semester === "Third") item.third += count;
    else if (r.semester === "Fifth") item.fifth += count;
    item.total += count;
  }

  return Array.from(map.values());
}

export function computeOutlierDays(
  dailyTrend: DailyTrendPoint[]
): OutlierDayItem[] {
  if (dailyTrend.length === 0) return [];
  const total = dailyTrend.reduce((acc, p) => acc + p.absent, 0);
  const avg = total / dailyTrend.length;

  return dailyTrend.map((pt) => {
    const deviation = pt.absent - avg;
    return {
      date: pt.date,
      label: pt.label,
      absent: pt.absent,
      average: avg,
      deviation,
      isSurge: pt.absent > avg * 1.4 && pt.absent > 10,
    };
  });
}

export function computeSemesterBreakdown(
  filteredRecords: AttendanceRecord[]
): SemesterBreakdownItem[] {
  const canonicalSemesters = ["First", "Third", "Fifth"];
  const map = new Map<string, SemesterBreakdownItem>();

  for (const sem of canonicalSemesters) {
    map.set(sem, { semester: sem, absent: 0, late: 0, bunk: 0, total: 0 });
  }

  for (const r of filteredRecords) {
    let item = map.get(r.semester);
    if (!item) {
      item = { semester: r.semester, absent: 0, late: 0, bunk: 0, total: 0 };
      map.set(r.semester, item);
    }
    const count = Number(r.count) || 0;
    if (r.type === "absent") item.absent += count;
    else if (r.type === "late") item.late += count;
    else if (r.type === "bunk") item.bunk += count;
    item.total += count;
  }

  return Array.from(map.values());
}

export function computeWeekdayPattern(
  filteredRecords: AttendanceRecord[]
): WeekdayPatternItem[] {
  const weekdays: Array<{ index: number; name: string; short: string }> = [
    { index: 1, name: "Monday", short: "Mon" },
    { index: 2, name: "Tuesday", short: "Tue" },
    { index: 3, name: "Wednesday", short: "Wed" },
    { index: 4, name: "Thursday", short: "Thu" },
    { index: 5, name: "Friday", short: "Fri" },
    { index: 6, name: "Saturday", short: "Sat" },
  ];

  const map = new Map<number, WeekdayPatternItem>();
  for (const w of weekdays) {
    map.set(w.index, {
      dayIndex: w.index,
      dayName: w.name,
      shortName: w.short,
      absent: 0,
      late: 0,
      bunk: 0,
      total: 0,
    });
  }

  for (const r of filteredRecords) {
    const dt = parseDateLocal(r.date);
    if (Number.isNaN(dt.getTime())) continue;
    const dayIdx = dt.getDay();
    let item = map.get(dayIdx);
    if (!item && dayIdx === 0) {
      item = {
        dayIndex: 0,
        dayName: "Sunday",
        shortName: "Sun",
        absent: 0,
        late: 0,
        bunk: 0,
        total: 0,
      };
      map.set(0, item);
    }
    if (!item) continue;

    const count = Number(r.count) || 0;
    if (r.type === "absent") item.absent += count;
    else if (r.type === "late") item.late += count;
    else if (r.type === "bunk") item.bunk += count;
    item.total += count;
  }

  return Array.from(map.values());
}

export function computeHeatmapData(
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[],
  activeDatesInRange: string[],
  activeDaysMap: Record<string, string[]>
): HeatmapMatrix {
  const cells: Record<string, Record<string, HeatmapCellData>> = {};
  let maxAbsent = 0;

  for (const prog of effectivePrograms) {
    cells[prog] = {};
    const progActiveSet = new Set(activeDaysMap?.[prog] || []);
    for (const date of activeDatesInRange) {
      cells[prog][date] = {
        program: prog,
        date,
        absent: 0,
        late: 0,
        bunk: 0,
        isActiveDay: progActiveSet.has(date),
        notes: [],
      };
    }
  }

  for (const r of filteredRecords) {
    if (!cells[r.program] || !cells[r.program][r.date]) continue;
    const cell = cells[r.program][r.date];
    const count = Number(r.count) || 0;
    if (r.type === "absent") {
      cell.absent += count;
      if (cell.absent > maxAbsent) {
        maxAbsent = cell.absent;
      }
    } else if (r.type === "late") {
      cell.late += count;
    } else if (r.type === "bunk") {
      cell.bunk += count;
    }
    if (r.note && r.note.trim() !== "") {
      cell.notes.push(`${r.semester} (${r.type}): ${r.note.trim()}`);
    }
  }

  return {
    programs: effectivePrograms,
    dates: activeDatesInRange,
    cells,
    maxAbsent,
  };
}

export function computeLeaderboard(
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[],
  activeDaysMap: Record<string, string[]>,
  dateFrom: string,
  dateTo: string
): LeaderboardRow[] {
  const rowsMap = new Map<string, LeaderboardRow>();

  for (const prog of effectivePrograms) {
    const progDays = (activeDaysMap?.[prog] || []).filter(
      (d) => (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)
    );
    rowsMap.set(prog, {
      program: prog,
      absent: 0,
      late: 0,
      bunk: 0,
      activeDays: progDays.length,
      avgAbsentPerDay: 0,
    });
  }

  for (const r of filteredRecords) {
    const row = rowsMap.get(r.program);
    if (!row) continue;
    const count = Number(r.count) || 0;
    if (r.type === "absent") row.absent += count;
    else if (r.type === "late") row.late += count;
    else if (r.type === "bunk") row.bunk += count;
  }

  const result: LeaderboardRow[] = [];
  for (const row of rowsMap.values()) {
    row.avgAbsentPerDay =
      row.activeDays > 0 ? row.absent / row.activeDays : 0;
    result.push(row);
  }

  return result;
}

export function computeStudentLookup(
  allRecords: AttendanceRecord[],
  program: string,
  rollNumber: number | null,
  filters: FilterState
): StudentLookupSummary {
  const programRecordsInFilter = allRecords.filter((r) => {
    if (r.program !== program) return false;
    if (filters.semester !== "all" && r.semester !== filters.semester)
      return false;
    if (filters.type !== "all" && r.type !== filters.type) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  const verifiedRecords = programRecordsInFilter.filter(
    (r) => r.rollsOk === true && Array.isArray(r.rolls)
  );

  if (rollNumber === null || Number.isNaN(rollNumber) || rollNumber <= 0) {
    return {
      program,
      roll: 0,
      absent: 0,
      late: 0,
      bunk: 0,
      timeline: [],
      verifiedProgramRecordsCount: verifiedRecords.length,
      totalProgramRecordsCount: programRecordsInFilter.length,
    };
  }

  let absent = 0;
  let late = 0;
  let bunk = 0;
  const timeline: StudentTimelineEntry[] = [];

  for (const r of verifiedRecords) {
    const matches = r.rolls.filter((num) => Number(num) === rollNumber).length;
    if (matches > 0) {
      if (r.type === "absent") absent += matches;
      else if (r.type === "late") late += matches;
      else if (r.type === "bunk") bunk += matches;

      timeline.push({
        date: r.date,
        semester: r.semester,
        type: r.type,
        note: r.note ? r.note.trim() : "",
      });
    }
  }

  timeline.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    return a.semester.localeCompare(b.semester);
  });

  return {
    program,
    roll: rollNumber,
    absent,
    late,
    bunk,
    timeline,
    verifiedProgramRecordsCount: verifiedRecords.length,
    totalProgramRecordsCount: programRecordsInFilter.length,
  };
}

export function computeTopAbsentRolls(
  allRecords: AttendanceRecord[],
  program: string,
  filters: FilterState,
  limit = 10
): {
  entries: FrequentRollEntry[];
  verifiedCount: number;
  totalCount: number;
} {
  const programRecordsInFilter = allRecords.filter((r) => {
    if (r.program !== program) return false;
    if (filters.semester !== "all" && r.semester !== filters.semester)
      return false;
    if (filters.type !== "all" && r.type !== filters.type) return false;
    if (filters.dateFrom && r.date < filters.dateFrom) return false;
    if (filters.dateTo && r.date > filters.dateTo) return false;
    return true;
  });

  const verifiedRecords = programRecordsInFilter.filter(
    (r) => r.rollsOk === true && Array.isArray(r.rolls)
  );

  const rollMap = new Map<
    number,
    {
      roll: number;
      semesters: Set<string>;
      absent: number;
      late: number;
      bunk: number;
      totalOccurrences: number;
    }
  >();

  for (const r of verifiedRecords) {
    for (const rawRoll of r.rolls) {
      const roll = Number(rawRoll);
      if (Number.isNaN(roll) || roll <= 0) continue;

      let entry = rollMap.get(roll);
      if (!entry) {
        entry = {
          roll,
          semesters: new Set<string>(),
          absent: 0,
          late: 0,
          bunk: 0,
          totalOccurrences: 0,
        };
        rollMap.set(roll, entry);
      }

      entry.semesters.add(r.semester);
      if (r.type === "absent") entry.absent += 1;
      else if (r.type === "late") entry.late += 1;
      else if (r.type === "bunk") entry.bunk += 1;
      entry.totalOccurrences += 1;
    }
  }

  const allEntries: FrequentRollEntry[] = Array.from(rollMap.values()).map(
    (item) => ({
      roll: item.roll,
      program,
      semesters: Array.from(item.semesters),
      absent: item.absent,
      late: item.late,
      bunk: item.bunk,
      totalOccurrences: item.totalOccurrences,
    })
  );

  const relevantEntries =
    filters.type === "late"
      ? allEntries.filter((e) => e.late > 0)
      : filters.type === "bunk"
      ? allEntries.filter((e) => e.bunk > 0)
      : allEntries.filter((e) => e.absent > 0);

  relevantEntries.sort((a, b) => {
    if (b.absent !== a.absent) return b.absent - a.absent;
    if (b.totalOccurrences !== a.totalOccurrences)
      return b.totalOccurrences - a.totalOccurrences;
    return a.roll - b.roll;
  });

  return {
    entries: relevantEntries.slice(0, limit),
    verifiedCount: verifiedRecords.length,
    totalCount: programRecordsInFilter.length,
  };
}

export function computeDataQuality(
  filteredRecords: AttendanceRecord[],
  effectivePrograms: string[]
) {
  const totalRecords = filteredRecords.length;
  const verifiedRecords = filteredRecords.filter((r) => r.rollsOk === true).length;
  const unverifiedRecords = totalRecords - verifiedRecords;
  const verifiedPercentage =
    totalRecords > 0 ? (verifiedRecords / totalRecords) * 100 : 100;

  const byProgram = effectivePrograms.map((prog) => {
    const progRecs = filteredRecords.filter((r) => r.program === prog);
    const progVerified = progRecs.filter((r) => r.rollsOk === true).length;
    const pct =
      progRecs.length > 0 ? (progVerified / progRecs.length) * 100 : 100;
    return {
      program: prog,
      total: progRecs.length,
      verified: progVerified,
      unverified: progRecs.length - progVerified,
      percentage: pct,
    };
  });

  const recordsWithNotes = filteredRecords
    .filter((r) => r.note && r.note.trim() !== "")
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalRecords,
    verifiedRecords,
    unverifiedRecords,
    verifiedPercentage,
    byProgram,
    recordsWithNotes,
  };
}

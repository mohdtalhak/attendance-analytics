/**
 * Google Apps Script Web App JSON endpoint for college attendance analytics.
 * Keep this constant at the top so it is easy to update if redeployed.
 */
export const API_URL =
  "https://script.google.com/macros/s/AKfycbwXXAKcvwwp9YM7RcokfHSjt6hthqeZ3L2RR1SBoRa3BWtccrky_P4lMV_Oq9_c4WkdHw/exec";

export type SemesterName = "First" | "Third" | "Fifth";
export type AttendanceType = "absent" | "late" | "bunk";

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  program: string; // e.g., "AO", "CO-A", "CO-B", "EJ", "ME", "CE", "EE"
  semester: SemesterName | string;
  type: AttendanceType | string;
  count: number;
  rolls: number[];
  rollsOk: boolean;
  note: string;
}

export interface AttendanceApiSuccessResponse {
  status: "success";
  updatedAt: string;
  programs: string[];
  dates: string[];
  activeDays: Record<string, string[]>;
  records: AttendanceRecord[];
  warnings: string[];
}

export interface AttendanceApiErrorResponse {
  status: "error";
  code?: string;
  message?: string;
}

export type AttendanceApiResponse =
  | AttendanceApiSuccessResponse
  | AttendanceApiErrorResponse;

export interface AuthCredentials {
  username: string;
  password: string;
}



export type SemesterFilter = "all" | "First" | "Third" | "Fifth";
export type TypeFilter = "all" | "absent" | "late" | "bunk";
export type DatePreset = "last7" | "last30" | "thisMonth" | "allTime" | "custom";

export interface FilterState {
  programs: string[]; // empty array means "All programs"
  semester: SemesterFilter;
  type: TypeFilter;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  datePreset: DatePreset;
}

export interface MetricDelta {
  current: number;
  previous: number;
  diff: number;
  percentChange: number | null;
  hasPreviousData: boolean;
}

export interface KpiMetrics {
  totalAbsent: number;
  totalLate: number;
  totalBunk: number;
  mostAbsentProgram: { program: string; count: number } | null;
  mostAbsentDay: { date: string; count: number } | null;
  activeDaysCount: number;
  avgAbsentPerActiveDay: number;
  isPeriodComparisonActive: boolean;
  comparisonDaysLength: number;
  prevPeriodRange: { from: string; to: string } | null;
  absentDelta: MetricDelta | null;
  lateDelta: MetricDelta | null;
  bunkDelta: MetricDelta | null;
  avgAbsentDelta: MetricDelta | null;
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM/YYYY
  shortLabel: string; // DD/MM
  absent: number;
  late: number;
  bunk: number;
  notes: Array<{ program: string; semester: string; type: string; note: string }>;
}

export interface ProgramComparisonItem {
  program: string;
  absent: number;
  late: number;
  bunk: number;
  total: number;
}

export interface SemesterBreakdownItem {
  semester: string;
  absent: number;
  late: number;
  bunk: number;
  total: number;
}

export interface WeekdayPatternItem {
  dayIndex: number; // 1 = Mon ... 6 = Sat
  dayName: string;
  shortName: string;
  absent: number;
  late: number;
  bunk: number;
  total: number;
}

export interface HeatmapCellData {
  program: string;
  date: string;
  absent: number;
  late: number;
  bunk: number;
  isActiveDay: boolean;
  notes: string[];
}

export interface HeatmapMatrix {
  programs: string[];
  dates: string[];
  cells: Record<string, Record<string, HeatmapCellData>>;
  maxAbsent: number;
}

export interface LeaderboardRow {
  program: string;
  absent: number;
  late: number;
  bunk: number;
  activeDays: number;
  avgAbsentPerDay: number;
}

export interface StudentTimelineEntry {
  date: string;
  semester: string;
  type: AttendanceType | string;
  note: string;
}

export interface StudentLookupSummary {
  program: string;
  roll: number;
  absent: number;
  late: number;
  bunk: number;
  timeline: StudentTimelineEntry[];
  verifiedProgramRecordsCount: number;
  totalProgramRecordsCount: number;
}

export interface FrequentRollEntry {
  roll: number;
  program: string;
  semesters: string[];
  absent: number;
  late: number;
  bunk: number;
  totalOccurrences: number;
}

// Option B Advanced Chart Structures
export interface CumulativeTrendPoint {
  date: string;
  label: string;
  shortLabel: string;
  cumulativeAbsent: number;
  cumulativeLate: number;
  cumulativeBunk: number;
  cumulativeTotal: number;
}

export interface ProgramSemesterMatrixItem {
  program: string;
  first: number;
  third: number;
  fifth: number;
  total: number;
}

export interface OutlierDayItem {
  date: string;
  label: string;
  absent: number;
  average: number;
  deviation: number;
  isSurge: boolean;
}

export const CHART_COLORS = {
  absent: "#3b6fe0",
  late: "#e5484d",
  bunk: "#f5a524",
  firstSemester: "#3b6fe0",
  thirdSemester: "#8b5cf6",
  fifthSemester: "#06b6d4",
} as const;

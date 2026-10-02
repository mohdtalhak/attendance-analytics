/**
 * ============================================================================
 * ATTENDVIEW ANALYTICS DASHBOARD (READ-ONLY STATIC SPA WITH SERVER AUTH)
 * ============================================================================
 *
 * HOW TO DEPLOY TO NETLIFY:
 * 1. Push this project folder to a GitHub/GitLab repository, OR run `npm run build`
 *    locally and drag-and-drop the generated `dist/` folder into https://app.netlify.com/drop
 * 2. If connecting via Git on Netlify:
 *    - Build command:     npm run build
 *    - Publish directory: dist
 * 3. No backend server or environment variables are required. All attendance data
 *    and user authentication are handled by the Google Apps Script JSON endpoint
 *    defined in `API_URL` below.
 * ============================================================================
 */

export const API_URL =
  "https://script.google.com/macros/s/AKfycbwXXAKcvwwp9YM7RcokfHSjt6hthqeZ3L2RR1SBoRa3BWtccrky_P4lMV_Oq9_c4WkdHw/exec";

const SESSION_USER_KEY = "attendance_auth_user";
const SESSION_PASS_KEY = "attendance_auth_pass";
const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RotateCcw, Calendar, Database } from "lucide-react";
import {
  AttendanceApiResponse,
  AttendanceApiSuccessResponse,
  AuthCredentials,
  DatePreset,
  FilterState,
  SemesterFilter,
  TypeFilter,
} from "./types";
import {
  computePresetDateRange,
  formatDateIndian,
  formatTimeHHMMSS,
} from "./utils/dateUtils";
import {
  computeCumulativeTrend,
  computeDailyTrend,
  computeDataQuality,
  computeHeatmapData,
  computeKpis,
  computeLeaderboard,
  computeOutlierDays,
  computeProgramComparison,
  computeProgramSemesterMatrix,
  computeSemesterBreakdown,
  computeWeekdayPattern,
  filterRecords,
  getActiveDaysForPrograms,
  getEffectivePrograms,
} from "./utils/analytics";
import { Header, ThemePreference } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { KpiSection } from "./components/KpiSection";
import { ChartsSection } from "./components/ChartsSection";
import { HeatmapTable } from "./components/HeatmapTable";
import { LeaderboardTable } from "./components/LeaderboardTable";
import { StudentLookupSection } from "./components/StudentLookupSection";
import { DataQualitySection } from "./components/DataQualitySection";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { SyncTestModal } from "./components/SyncTestModal";
import { LoginScreen } from "./components/LoginScreen";

export default function App() {
  // Authentication & session state
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);

  // Dashboard dataset & loading state
  const [data, setData] = useState<AttendanceApiSuccessResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isSyncGuideOpen, setIsSyncGuideOpen] = useState<boolean>(false);

  // Theme state: follows system setting by default
  const [themePref, setThemePref] = useState<ThemePreference>("system");
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark =
    themePref === "system" ? systemDark : themePref === "dark";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isDark]);

  const handleToggleTheme = useCallback(() => {
    setThemePref((prev) =>
      prev === "system" ? "light" : prev === "light" ? "dark" : "system"
    );
  }, []);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    programs: [],
    semester: "all",
    type: "all",
    dateFrom: "",
    dateTo: "",
    datePreset: "allTime",
  });

  const filtersInitializedRef = useRef<boolean>(false);

  /**
   * Helper to normalize data payload and update filter bounds.
   */
  const handleDataPayload = useCallback((json: AttendanceApiSuccessResponse) => {
    const sortedDates = Array.isArray(json.dates)
      ? [...json.dates].sort()
      : [];

    const normalizedData: AttendanceApiSuccessResponse = {
      status: "success",
      updatedAt: json.updatedAt || new Date().toISOString(),
      programs: Array.isArray(json.programs) ? json.programs : [],
      dates: sortedDates,
      activeDays: json.activeDays || {},
      records: Array.isArray(json.records) ? json.records : [],
      warnings: Array.isArray(json.warnings) ? json.warnings : [],
    };

    setData(normalizedData);
    setSyncError(null);
    setLastSyncedTime(formatTimeHHMMSS(new Date()));

    setFilters((prev) => {
      if (!filtersInitializedRef.current) {
        filtersInitializedRef.current = true;
        const range = computePresetDateRange("allTime", sortedDates);
        return {
          ...prev,
          dateFrom: range.from,
          dateTo: range.to,
          datePreset: "allTime",
        };
      }
      if (prev.datePreset !== "custom") {
        const range = computePresetDateRange(prev.datePreset, sortedDates);
        return {
          ...prev,
          dateFrom: range.from,
          dateTo: range.to,
        };
      }
      return prev;
    });
  }, []);

  /**
   * Clears credentials, stops auto-refresh, and returns to login screen.
   */
  const handleLogout = useCallback((expiredMessage?: string) => {
    try {
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_PASS_KEY);
    } catch {
      // Ignore storage errors
    }
    setCredentials(null);
    setIsAuthenticated(false);
    setData(null);
    filtersInitializedRef.current = false;
    setLoginErrorMessage(expiredMessage || null);
  }, []);

  /**
   * Plain GET fetch using authenticated credentials.
   * Dispatches force refresh with &refresh=1 when requested.
   */
  const fetchAttendanceData = useCallback(
    async (
      auth: AuthCredentials,
      options: { forceRefresh?: boolean; isBackground?: boolean } = {}
    ) => {
      const { forceRefresh = false, isBackground = false } = options;

      if (!isBackground) {
        setIsSyncing(true);
      }

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("user", auth.username);
        queryParams.set("pass", auth.password);
        if (forceRefresh) {
          queryParams.set("refresh", "1");
        }

        const endpoint = `${API_URL}?${queryParams.toString()}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 401) {
            handleLogout("Your session is no longer valid. Please sign in again.");
            return;
          }
          throw new Error("Could not reach the server. Check your connection and try again.");
        }

        let json: AttendanceApiResponse;
        try {
          json = (await response.json()) as AttendanceApiResponse;
        } catch {
          throw new Error("Received invalid response from the server.");
        }

        if (json.status === "error") {
          if (json.code === "unauthorized") {
            handleLogout("Your session is no longer valid. Please sign in again.");
            return;
          }
          throw new Error(json.message || "An unexpected error occurred.");
        }

        if (!Array.isArray(json.records) || !Array.isArray(json.programs)) {
          throw new Error("Received invalid data structure from the server.");
        }

        handleDataPayload(json);
      } catch (err) {
        if (!isBackground) {
          const message =
            err instanceof Error
              ? err.message
              : "Could not reach the server. Check your connection and try again.";
          setSyncError(message);
        }
      } finally {
        setIsInitialLoading(false);
        setIsSyncing(false);
      }
    },
    [handleDataPayload, handleLogout]
  );

  /**
   * Handles user sign-in from the LoginScreen.
   */
  const handleLogin = useCallback(
    async (username: string, pass: string): Promise<boolean> => {
      setIsCheckingAuth(true);
      setLoginErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("user", username);
        queryParams.set("pass", pass);

        const endpoint = `${API_URL}?${queryParams.toString()}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 401) {
            setLoginErrorMessage("Wrong username or password. Please try again.");
            return false;
          }
          setLoginErrorMessage("Could not reach the server. Check your connection and try again.");
          return false;
        }

        let json: AttendanceApiResponse;
        try {
          json = (await response.json()) as AttendanceApiResponse;
        } catch {
          setLoginErrorMessage("Could not reach the server. Check your connection and try again.");
          return false;
        }

        if (json.status === "error") {
          if (json.code === "unauthorized") {
            setLoginErrorMessage("Wrong username or password. Please try again.");
            return false;
          }
          setLoginErrorMessage(json.message || "Could not reach the server. Check your connection and try again.");
          return false;
        }

        if (!Array.isArray(json.records) || !Array.isArray(json.programs)) {
          setLoginErrorMessage("Could not reach the server. Check your connection and try again.");
          return false;
        }

        // Store credentials in memory and tab-specific sessionStorage
        const authPayload: AuthCredentials = { username, password: pass };
        setCredentials(authPayload);
        setIsAuthenticated(true);

        try {
          sessionStorage.setItem(SESSION_USER_KEY, username);
          sessionStorage.setItem(SESSION_PASS_KEY, pass);
        } catch {
          // Ignore sessionStorage restriction
        }

        handleDataPayload(json);
        return true;
      } catch {
        setLoginErrorMessage("Could not reach the server. Check your connection and try again.");
        return false;
      } finally {
        setIsCheckingAuth(false);
      }
    },
    [handleDataPayload]
  );

  /**
   * Tab-refresh restore:
   * If the user refreshed the existing tab, check sessionStorage for stored credentials.
   * If found, validate with the server. If not found, stay on the login screen.
   */
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
      const storedPass = sessionStorage.getItem(SESSION_PASS_KEY);

      if (storedUser && storedPass) {
        setIsInitialLoading(true);
        handleLogin(storedUser, storedPass).then((success) => {
          if (!success) {
            handleLogout("Your session is no longer valid. Please sign in again.");
          }
          setIsInitialLoading(false);
        });
      }
    } catch {
      // In restricted environments, sessionStorage may throw
    }
  }, [handleLogin, handleLogout]);

  /**
   * Background auto-refresh every 2 minutes while authenticated and tab is active.
   */
  useEffect(() => {
    if (!isAuthenticated || !credentials) return;

    const intervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }
      fetchAttendanceData(credentials, { forceRefresh: false, isBackground: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, credentials, fetchAttendanceData]);

  // Filter actions
  const handleToggleProgram = useCallback((program: string) => {
    setFilters((prev) => {
      const exists = prev.programs.includes(program);
      const nextPrograms = exists
        ? prev.programs.filter((p) => p !== program)
        : [...prev.programs, program];
      return {
        ...prev,
        programs: nextPrograms,
      };
    });
  }, []);

  const handleSelectAllPrograms = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      programs: [],
    }));
  }, []);

  const handleChangeSemester = useCallback((semester: SemesterFilter) => {
    setFilters((prev) => ({
      ...prev,
      semester,
    }));
  }, []);

  const handleChangeType = useCallback((type: TypeFilter) => {
    setFilters((prev) => ({
      ...prev,
      type,
    }));
  }, []);

  const handleChangeDateRange = useCallback((from: string, to: string) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: from,
      dateTo: to,
      datePreset: "custom",
    }));
  }, []);

  const handleSelectDatePreset = useCallback(
    (preset: DatePreset) => {
      const allDates = data?.dates || [];
      const range = computePresetDateRange(preset, allDates);
      setFilters((prev) => ({
        ...prev,
        dateFrom: range.from,
        dateTo: range.to,
        datePreset: preset,
      }));
    },
    [data?.dates]
  );

  const handleResetFilters = useCallback(() => {
    const allDates = data?.dates || [];
    const range = computePresetDateRange("allTime", allDates);
    setFilters({
      programs: [],
      semester: "all",
      type: "all",
      dateFrom: range.from,
      dateTo: range.to,
      datePreset: "allTime",
    });
  }, [data?.dates]);

  const hasActiveFilters = useMemo(() => {
    if (!data) return false;
    const minDate = data.dates[0] || "";
    const maxDate = data.dates[data.dates.length - 1] || "";
    return (
      filters.programs.length > 0 ||
      filters.semester !== "all" ||
      filters.type !== "all" ||
      filters.datePreset !== "allTime" ||
      (Boolean(minDate) && filters.dateFrom !== minDate) ||
      (Boolean(maxDate) && filters.dateTo !== maxDate)
    );
  }, [data, filters]);

  // Analytics memos
  const effectivePrograms = useMemo(
    () => getEffectivePrograms(data?.programs || [], filters.programs),
    [data?.programs, filters.programs]
  );

  const activeDatesInRange = useMemo(
    () =>
      getActiveDaysForPrograms(
        data?.activeDays || {},
        effectivePrograms,
        filters.dateFrom,
        filters.dateTo,
        data?.dates || []
      ),
    [
      data?.activeDays,
      data?.dates,
      effectivePrograms,
      filters.dateFrom,
      filters.dateTo,
    ]
  );

  const filteredRecords = useMemo(
    () =>
      filterRecords(
        data?.records || [],
        effectivePrograms,
        filters.semester,
        filters.type,
        filters.dateFrom,
        filters.dateTo
      ),
    [
      data?.records,
      effectivePrograms,
      filters.semester,
      filters.type,
      filters.dateFrom,
      filters.dateTo,
    ]
  );

  const kpis = useMemo(() => {
    if (!data) return null;
    return computeKpis(
      data,
      filteredRecords,
      effectivePrograms,
      activeDatesInRange,
      filters
    );
  }, [data, filteredRecords, effectivePrograms, activeDatesInRange, filters]);

  const dailyTrend = useMemo(
    () => computeDailyTrend(filteredRecords, activeDatesInRange),
    [filteredRecords, activeDatesInRange]
  );

  const programComparison = useMemo(
    () => computeProgramComparison(filteredRecords, effectivePrograms),
    [filteredRecords, effectivePrograms]
  );

  const semesterBreakdown = useMemo(
    () => computeSemesterBreakdown(filteredRecords),
    [filteredRecords]
  );

  const weekdayPattern = useMemo(
    () => computeWeekdayPattern(filteredRecords),
    [filteredRecords]
  );

  const cumulativeTrend = useMemo(
    () => computeCumulativeTrend(dailyTrend),
    [dailyTrend]
  );

  const programSemesterMatrix = useMemo(
    () => computeProgramSemesterMatrix(filteredRecords, effectivePrograms),
    [filteredRecords, effectivePrograms]
  );

  const outlierDays = useMemo(
    () => computeOutlierDays(dailyTrend),
    [dailyTrend]
  );

  const heatmap = useMemo(
    () =>
      computeHeatmapData(
        filteredRecords,
        effectivePrograms,
        activeDatesInRange,
        data?.activeDays || {}
      ),
    [filteredRecords, effectivePrograms, activeDatesInRange, data?.activeDays]
  );

  const leaderboardRows = useMemo(
    () =>
      computeLeaderboard(
        filteredRecords,
        effectivePrograms,
        data?.activeDays || {},
        filters.dateFrom,
        filters.dateTo
      ),
    [
      filteredRecords,
      effectivePrograms,
      data?.activeDays,
      filters.dateFrom,
      filters.dateTo,
    ]
  );

  const dataQuality = useMemo(
    () => computeDataQuality(filteredRecords, effectivePrograms),
    [filteredRecords, effectivePrograms]
  );

  // If not authenticated, render ONLY the login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isChecking={isCheckingAuth || isInitialLoading}
        errorMessage={loginErrorMessage}
        themePref={themePref}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        lastSyncedTime={lastSyncedTime}
        isSyncing={isSyncing}
        onSyncNow={() => {
          if (credentials) {
            fetchAttendanceData(credentials, { forceRefresh: true, isBackground: false });
          }
        }}
        themePref={themePref}
        onToggleTheme={handleToggleTheme}
        onOpenSyncGuide={() => setIsSyncGuideOpen(true)}
        onLogout={() => handleLogout()}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Sync Error Banner */}
        {syncError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">Unable to sync attendance data</p>
                <p className="mt-0.5 text-rose-800 dark:text-rose-300">
                  {syncError}
                  {data ? " Showing the last successfully synced dataset below." : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (credentials) {
                  fetchAttendanceData(credentials, { forceRefresh: true, isBackground: false });
                }
              }}
              disabled={isSyncing}
              className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 sm:self-auto"
            >
              <span>{isSyncing ? "Retrying..." : "Try again"}</span>
            </button>
          </div>
        )}

        {/* First load skeleton */}
        {!data && isInitialLoading && <LoadingSkeleton />}

        {/* Main dashboard content */}
        {data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Read-only consolidated sheet analytics</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {data.programs.length} programs ({data.programs.join(", ")})
                </span>
                {data.dates.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        Dataset span: {formatDateIndian(data.dates[0])} to{" "}
                        {formatDateIndian(data.dates[data.dates.length - 1])}
                      </span>
                    </span>
                  </>
                )}
              </div>

              <div className="font-mono tabular-nums">
                Showing {filteredRecords.length.toLocaleString("en-IN")} of{" "}
                {data.records.length.toLocaleString("en-IN")} records
              </div>
            </div>

            <FilterBar
              allPrograms={data.programs}
              allDates={data.dates}
              filters={filters}
              onToggleProgram={handleToggleProgram}
              onSelectAllPrograms={handleSelectAllPrograms}
              onChangeSemester={handleChangeSemester}
              onChangeType={handleChangeType}
              onChangeDateRange={handleChangeDateRange}
              onSelectDatePreset={handleSelectDatePreset}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {filteredRecords.length === 0 ? (
              <section
                aria-label="No matching records"
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  No records for these filters
                </p>
                <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                  No attendance entries match your selected program, semester,
                  type, and date range combination. Reset filters to view all
                  available records.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#3b6fe0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2f5ec4] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset filters</span>
                </button>
              </section>
            ) : (
              <>
                {kpis && <KpiSection kpis={kpis} />}

                {/* Option A & Option B Charts */}
                <ChartsSection
                  dailyTrend={dailyTrend}
                  cumulativeTrend={cumulativeTrend}
                  programComparison={programComparison}
                  programSemesterMatrix={programSemesterMatrix}
                  semesterBreakdown={semesterBreakdown}
                  weekdayPattern={weekdayPattern}
                  outlierDays={outlierDays}
                  totalAbsent={kpis?.totalAbsent || 0}
                  totalLate={kpis?.totalLate || 0}
                  totalBunk={kpis?.totalBunk || 0}
                  isDark={isDark}
                />

                <HeatmapTable heatmap={heatmap} />

                <LeaderboardTable rows={leaderboardRows} />
              </>
            )}

            <StudentLookupSection
              allPrograms={data.programs}
              allRecords={data.records}
              filters={filters}
            />

            <DataQualitySection
              totalRecords={dataQuality.totalRecords}
              verifiedRecords={dataQuality.verifiedRecords}
              unverifiedRecords={dataQuality.unverifiedRecords}
              verifiedPercentage={dataQuality.verifiedPercentage}
              byProgram={dataQuality.byProgram}
              warnings={data.warnings}
              recordsWithNotes={dataQuality.recordsWithNotes}
            />
          </>
        )}
      </main>

      <SyncTestModal
        isOpen={isSyncGuideOpen}
        onClose={() => setIsSyncGuideOpen(false)}
        lastSyncedTime={lastSyncedTime}
        isSyncing={isSyncing}
        onSyncNow={() => {
          if (credentials) {
            fetchAttendanceData(credentials, { forceRefresh: true, isBackground: false });
          }
        }}
      />

      <footer className="mt-12 border-t border-slate-200 bg-white py-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8 dark:text-slate-400">
          <span>
            AttendView Analytics · Secure Authorized Portal
          </span>
          <span className="font-mono tabular-nums">
            Auto-refreshes every 2 minutes while tab is active
          </span>
        </div>
      </footer>
    </div>
  );
}

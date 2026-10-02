import { DatePreset } from "../types";

export function parseDateLocal(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export function toISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateIndian(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr || "—";
  }
  const dt = parseDateLocal(dateStr);
  if (Number.isNaN(dt.getTime())) {
    return dateStr;
  }
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateShortIndian(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr || "";
  }
  const dt = parseDateLocal(dateStr);
  if (Number.isNaN(dt.getTime())) {
    return dateStr;
  }
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

export function formatTimeHHMMSS(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function addCalendarDays(dateStr: string, deltaDays: number): string {
  const dt = parseDateLocal(dateStr);
  dt.setDate(dt.getDate() + deltaDays);
  return toISODateLocal(dt);
}

export function computePresetDateRange(
  preset: DatePreset,
  allSortedDates: string[]
): { from: string; to: string } {
  if (!allSortedDates || allSortedDates.length === 0) {
    return { from: "", to: "" };
  }

  const minDate = allSortedDates[0];
  const maxDate = allSortedDates[allSortedDates.length - 1];

  switch (preset) {
    case "last7": {
      const fromCandidate = addCalendarDays(maxDate, -6);
      const from = fromCandidate < minDate ? minDate : fromCandidate;
      return { from, to: maxDate };
    }
    case "last30": {
      const fromCandidate = addCalendarDays(maxDate, -29);
      const from = fromCandidate < minDate ? minDate : fromCandidate;
      return { from, to: maxDate };
    }
    case "thisMonth": {
      const maxDt = parseDateLocal(maxDate);
      const monthStart = toISODateLocal(new Date(maxDt.getFullYear(), maxDt.getMonth(), 1));
      const from = monthStart < minDate ? minDate : monthStart;
      return { from, to: maxDate };
    }
    case "allTime":
    case "custom":
    default:
      return { from: minDate, to: maxDate };
  }
}

export function computePreviousPeriodRange(
  from: string,
  to: string
): { prevFrom: string; prevTo: string; daysCount: number } | null {
  if (!from || !to || from > to) {
    return null;
  }
  const fromDt = parseDateLocal(from);
  const toDt = parseDateLocal(to);
  if (Number.isNaN(fromDt.getTime()) || Number.isNaN(toDt.getTime())) {
    return null;
  }
  const diffMs = toDt.getTime() - fromDt.getTime();
  const daysCount = Math.round(diffMs / 86_400_000) + 1;
  if (daysCount <= 0) {
    return null;
  }
  const prevTo = addCalendarDays(from, -1);
  const prevFrom = addCalendarDays(from, -daysCount);
  return { prevFrom, prevTo, daysCount };
}

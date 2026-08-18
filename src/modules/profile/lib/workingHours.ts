/**
 * @file workingHours.ts
 *
 * Pure, framework-free mapping for the unified working-hours range model
 * behind `PUT /api/profile/working-days`. The stored/sent values (day codes,
 * 24h times) are ASCII-only — the backend column is not Unicode-safe — while
 * every human-facing label is resolved separately via i18n keys or
 * {@link formatTimeDisplay}. No React here: this is the sustainable,
 * unit-testable core reused by {@link WorkingHoursSelector} and, later, by
 * scrap once its role is allowed to call the endpoint.
 */

/** ASCII 3-letter day code — the only form ever sent to the backend. */
export type DayCode = "Sat" | "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

/** Week order as accepted by the unified range model (Saturday-first). */
export const DAY_CODES: readonly DayCode[] = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

/** One selectable day option — i18nKey resolves the display label. */
export interface DayOption {
  value: DayCode;
  i18nKey: string;
}

export const DAY_OPTIONS: readonly DayOption[] = DAY_CODES.map((value) => ({
  value,
  i18nKey: `accountProfile.workingHours.days.${value}`,
}));

/** 24h "HH:mm" time code in 30-minute steps, "00:00".."23:30". */
export const TIME_CODES: readonly string[] = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

/** The four controlled values behind the unified working-hours selector. */
export interface WorkingHoursRangeValue {
  fromDay: DayCode;
  toDay: DayCode;
  fromTime: string;
  toTime: string;
}

export const DEFAULT_WORKING_HOURS_RANGE: WorkingHoursRangeValue = {
  fromDay: "Sat",
  toDay: "Thu",
  fromTime: "09:00",
  toTime: "18:00",
};

/** Body for `PUT /api/profile/working-days` — both fields always sent together. */
export interface WorkingDaysPayload {
  workingDays: string;
  workingHours: string;
}

function isDayCode(value: string): value is DayCode {
  return (DAY_CODES as readonly string[]).includes(value);
}

function isTimeCode(value: string): boolean {
  return (TIME_CODES as readonly string[]).includes(value);
}

/** Serializes the 4-value form state into the `workingDays`/`workingHours` wire format. */
export function serializeWorkingDaysRange(value: WorkingHoursRangeValue): WorkingDaysPayload {
  return {
    workingDays: `${value.fromDay}-${value.toDay}`,
    workingHours: `${value.fromTime}-${value.toTime}`,
  };
}

/**
 * Parses the raw `workingDays`/`workingHours` strings back into the 4-value
 * form state. Falls back to {@link DEFAULT_WORKING_HOURS_RANGE} piecewise for
 * anything missing, empty, or unrecognized — never throws.
 */
export function parseWorkingDaysRange(
  workingDays: string | null | undefined,
  workingHours: string | null | undefined,
): WorkingHoursRangeValue {
  const [fromDayRaw, toDayRaw] = (workingDays ?? "").split("-");
  const [fromTimeRaw, toTimeRaw] = (workingHours ?? "").split("-");

  const fromDay = fromDayRaw && isDayCode(fromDayRaw) ? fromDayRaw : DEFAULT_WORKING_HOURS_RANGE.fromDay;
  const toDay = toDayRaw && isDayCode(toDayRaw) ? toDayRaw : DEFAULT_WORKING_HOURS_RANGE.toDay;
  const fromTime = fromTimeRaw && isTimeCode(fromTimeRaw) ? fromTimeRaw : DEFAULT_WORKING_HOURS_RANGE.fromTime;
  const toTime = toTimeRaw && isTimeCode(toTimeRaw) ? toTimeRaw : DEFAULT_WORKING_HOURS_RANGE.toTime;

  return { fromDay, toDay, fromTime, toTime };
}

/** Result of validating a {@link WorkingHoursRangeValue}. */
export interface WorkingHoursValidation {
  dayRangeValid: boolean;
  timeRangeValid: boolean;
  isValid: boolean;
}

/** to-day must not be before from-day; to-time must be strictly after from-time. */
export function validateWorkingHoursRange(value: WorkingHoursRangeValue): WorkingHoursValidation {
  const dayRangeValid = DAY_CODES.indexOf(value.toDay) >= DAY_CODES.indexOf(value.fromDay);
  const timeRangeValid = value.toTime > value.fromTime;
  return { dayRangeValid, timeRangeValid, isValid: dayRangeValid && timeRangeValid };
}

/**
 * Formats a "HH:mm" time code as a localized 12h display string, e.g.
 * "9:00 AM" (en) or "٩:٠٠ ص" (ar) — display-only, never sent to the backend.
 */
export function formatTimeDisplay(time: string, lang: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const asDate = new Date(2000, 0, 1, hours, minutes);
  const locale = lang.startsWith("ar") ? "ar-SA" : "en-US";
  return asDate.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * Formats a Date object into a YYYY-MM-DD string in the specified timezone.
 */
function getLocalDateString(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    // Fallback to UTC if timezone string is invalid
    return date.toISOString().split("T")[0];
  }
}

/**
 * Calculates consecutive active calendar days (ending either today or yesterday in local time).
 * Pure function with zero I/O for deterministic testing.
 *
 * @param dates - Array of session completion timestamps
 * @param timeZone - IANA timezone string (e.g. "America/New_York", "Asia/Kolkata", "UTC")
 * @param today - Current reference Date
 */
export function computeStreak(
  dates: Date[],
  timeZone: string,
  today: Date = new Date()
): number {
  if (!dates || dates.length === 0) {
    return 0;
  }

  // Convert each session date to local YYYY-MM-DD in the user's timezone
  const uniqueLocalDays = new Set<string>();
  for (const date of dates) {
    if (date && !isNaN(date.getTime())) {
      uniqueLocalDays.add(getLocalDateString(date, timeZone));
    }
  }

  if (uniqueLocalDays.size === 0) {
    return 0;
  }

  const todayStr = getLocalDateString(today, timeZone);

  // Calculate yesterday in local timezone by subtracting 24 hours from reference
  const yesterdayDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getLocalDateString(yesterdayDate, timeZone);

  // A streak is active if the user completed a session either today or yesterday
  let checkDate: Date;
  let streak = 0;

  if (uniqueLocalDays.has(todayStr)) {
    streak = 1;
    checkDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else if (uniqueLocalDays.has(yesterdayStr)) {
    streak = 1;
    checkDate = new Date(yesterdayDate.getTime() - 24 * 60 * 60 * 1000);
  } else {
    // If no sessions today or yesterday, the active streak has lapsed
    return 0;
  }

  // Walk backward day by day to count consecutive days
  while (true) {
    const dayStr = getLocalDateString(checkDate, timeZone);
    if (uniqueLocalDays.has(dayStr)) {
      streak += 1;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

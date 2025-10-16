import { format, isSameDay } from "date-fns";

/**
 * Format date range for display (without year)
 * Example: "December 16th, 2:00 PM → December 18th, 4:00 PM"
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (isSameDay(startDate, endDate)) {
    return `${format(startDate, "MMMM do, p")} → ${format(endDate, "p")}`;
  }
  return `${format(startDate, "MMMM do, p")} → ${format(
    endDate,
    "MMMM do, p"
  )}`;
};

/**
 * Format duration accurately in hours and minutes
 * Examples: "43 minutes", "1 hour 15 minutes", "2 hours"
 */
export const formatDuration = (startDate: Date, endDate: Date): string => {
  const durationMs = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
      minutes !== 1 ? "s" : ""
    }`;
  }
};

/**
 * Get minimum datetime for datetime-local inputs (prevents selecting past dates)
 * Returns format: "YYYY-MM-DDTHH:mm" in local timezone
 */
export const getMinDateTime = (): string => {
  const now = new Date();
  // Adjust for timezone: converts local time to ISO format for datetime-local input
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

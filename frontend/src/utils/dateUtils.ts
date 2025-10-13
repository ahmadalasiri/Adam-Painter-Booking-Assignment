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
 * Format duration in hours
 * Example: "2 hours"
 */
export const formatDuration = (startDate: Date, endDate: Date): string => {
  const durationHours = Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  );
  return `${durationHours} hour${durationHours !== 1 ? "s" : ""}`;
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

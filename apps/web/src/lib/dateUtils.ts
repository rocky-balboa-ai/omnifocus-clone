import { format, parseISO } from 'date-fns';

/**
 * Format a date as a local date string (YYYY-MM-DD) without timezone conversion.
 *
 * This ensures dates are stored as the user's local date, not converted to UTC.
 * Use this for due dates and defer dates where we care about the calendar day,
 * not the exact moment in time.
 *
 * DO NOT use .toISOString() for due/defer dates as it converts to UTC, causing
 * timezone bugs (e.g., Dubai user setting "tomorrow" would get wrong date).
 */
export function toLocalDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date string (ISO or date-only) to a Date object for display purposes.
 *
 * For date-only strings (YYYY-MM-DD), parses at noon local time to avoid
 * timezone edge cases where midnight UTC might display as the previous day.
 *
 * For full ISO strings with time (contains 'T'), parses normally.
 *
 * Use this when displaying due dates and defer dates to ensure consistent
 * display across timezones.
 */
export function parseDateForDisplay(dateStr: string): Date {
  if (dateStr.includes('T')) {
    // Full ISO string - extract just the date part to avoid timezone issues
    const datePart = dateStr.split('T')[0];
    // Parse at noon local time to avoid DST/timezone edge cases
    return new Date(`${datePart}T12:00:00`);
  }
  // Date-only string - parse at noon local time
  return new Date(`${dateStr}T12:00:00`);
}

/**
 * Extract just the date portion (YYYY-MM-DD) from an ISO date string.
 * Useful when you need to compare dates without timezone complications.
 */
export function extractDatePart(dateStr: string): string {
  return dateStr.split('T')[0];
}

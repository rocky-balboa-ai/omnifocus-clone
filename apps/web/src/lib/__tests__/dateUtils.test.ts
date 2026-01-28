import { toLocalDateString, parseDateForDisplay, extractDatePart } from '../dateUtils';

describe('dateUtils', () => {
  describe('toLocalDateString', () => {
    it('should format date as YYYY-MM-DD without timezone conversion', () => {
      // Create a date for Jan 29, 2026
      const date = new Date(2026, 0, 29); // Month is 0-indexed
      expect(toLocalDateString(date)).toBe('2026-01-29');
    });

    it('should preserve local date regardless of time', () => {
      // Create a date late in the day
      const date = new Date(2026, 0, 29, 23, 59, 59);
      expect(toLocalDateString(date)).toBe('2026-01-29');
    });

    it('should not convert to UTC', () => {
      // This is the key test - the date should stay in local timezone
      const now = new Date();
      const result = toLocalDateString(now);

      // The result should match the local date, not UTC
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      expect(result).toBe(`${localYear}-${localMonth}-${localDay}`);
    });
  });

  describe('parseDateForDisplay', () => {
    it('should parse ISO string and return correct date', () => {
      // This tests that we extract the date part correctly
      const result = parseDateForDisplay('2026-01-29T00:00:00.000Z');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(29);
    });

    it('should parse date-only string correctly', () => {
      const result = parseDateForDisplay('2026-01-29');
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(29);
    });

    it('should handle dates that would cross day boundary in different timezones', () => {
      // "2026-01-29T00:00:00.000Z" is midnight UTC
      // In a western timezone (e.g., UTC-10), this would be Jan 28 if parsed as UTC
      // Our function should still return Jan 29 because we extract the date part
      const result = parseDateForDisplay('2026-01-29T00:00:00.000Z');
      expect(result.getDate()).toBe(29); // Should be 29, not 28
    });
  });

  describe('extractDatePart', () => {
    it('should extract date from ISO string', () => {
      expect(extractDatePart('2026-01-29T00:00:00.000Z')).toBe('2026-01-29');
    });

    it('should handle date-only string', () => {
      expect(extractDatePart('2026-01-29')).toBe('2026-01-29');
    });

    it('should extract date from ISO string with different times', () => {
      expect(extractDatePart('2026-01-29T20:00:00.000Z')).toBe('2026-01-29');
      expect(extractDatePart('2026-01-29T12:30:45.123Z')).toBe('2026-01-29');
    });
  });
});

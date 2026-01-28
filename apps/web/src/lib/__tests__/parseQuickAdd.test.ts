import { parseQuickAdd } from '../parseQuickAdd';
import { format, addDays, startOfDay } from 'date-fns';

describe('parseQuickAdd', () => {
  describe('basic parsing', () => {
    it('should extract title from simple input', () => {
      const result = parseQuickAdd('Buy groceries');
      expect(result.title).toBe('Buy groceries');
    });

    it('should extract flagged status', () => {
      const result = parseQuickAdd('Important task !flag');
      expect(result.title).toBe('Important task');
      expect(result.flagged).toBe(true);
    });

    it('should extract estimated time in minutes', () => {
      const result = parseQuickAdd('Quick task ~15m');
      expect(result.title).toBe('Quick task');
      expect(result.estimatedMinutes).toBe(15);
    });

    it('should extract estimated time in hours', () => {
      const result = parseQuickAdd('Long task ~2h');
      expect(result.title).toBe('Long task');
      expect(result.estimatedMinutes).toBe(120);
    });

    it('should extract project name', () => {
      const result = parseQuickAdd('Task #MyProject');
      expect(result.title).toBe('Task');
      expect(result.projectName).toBe('MyProject');
    });

    it('should extract tag names', () => {
      const result = parseQuickAdd('Task @work @urgent');
      expect(result.title).toBe('Task');
      expect(result.tagNames).toEqual(['work', 'urgent']);
    });
  });

  describe('date parsing', () => {
    it('should parse "today" as today\'s date', () => {
      const result = parseQuickAdd('Do this today');
      const today = startOfDay(new Date());
      const expectedDate = format(today, 'yyyy-MM-dd');

      // The returned date should represent today in local timezone
      // Extract just the date portion for comparison
      const returnedDate = result.dueDate?.substring(0, 10);
      expect(returnedDate).toBe(expectedDate);
    });

    it('should parse "tomorrow" as tomorrow\'s local date', () => {
      const result = parseQuickAdd('Do this tomorrow');
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const expectedDate = format(tomorrow, 'yyyy-MM-dd');

      // The returned date should represent tomorrow in local timezone
      // Extract just the date portion for comparison
      const returnedDate = result.dueDate?.substring(0, 10);
      expect(returnedDate).toBe(expectedDate);
    });

    /**
     * TIMEZONE BUG TEST
     *
     * This test catches the bug where dates are incorrectly converted to UTC.
     *
     * The bug: When using .toISOString(), local dates are converted to UTC.
     * For a user in Dubai (GMT+4), "tomorrow" on Jan 28 local means Jan 29 local.
     * But Jan 29 00:00 Dubai = Jan 28 20:00 UTC.
     * So toISOString() returns "2024-01-28T20:00:00.000Z" - the wrong date!
     *
     * The fix: Store dates as local date strings (YYYY-MM-DD) without time/timezone.
     */
    it('should store due date as local date string without UTC conversion', () => {
      const result = parseQuickAdd('Task tomorrow');

      // The dueDate should be a date-only string (YYYY-MM-DD format)
      // NOT a full ISO string with UTC time that causes timezone issues
      expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's actually tomorrow's date in local timezone
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const expectedDate = format(tomorrow, 'yyyy-MM-dd');
      expect(result.dueDate).toBe(expectedDate);
    });

    it('should store defer date as local date string without UTC conversion', () => {
      const result = parseQuickAdd('Task defer tomorrow');

      // The deferDate should be a date-only string (YYYY-MM-DD format)
      expect(result.deferDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's actually tomorrow's date in local timezone
      const tomorrow = addDays(startOfDay(new Date()), 1);
      const expectedDate = format(tomorrow, 'yyyy-MM-dd');
      expect(result.deferDate).toBe(expectedDate);
    });

    it('should parse "next week" as next Monday', () => {
      const result = parseQuickAdd('Weekly review next week');
      expect(result.title).toBe('Weekly review');
      // Should be a date-only string
      expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should parse "in 3 days" correctly', () => {
      const result = parseQuickAdd('Follow up in 3 days');
      const inThreeDays = addDays(startOfDay(new Date()), 3);
      const expectedDate = format(inThreeDays, 'yyyy-MM-dd');

      expect(result.title).toBe('Follow up');
      expect(result.dueDate).toBe(expectedDate);
    });
  });

  describe('combined patterns', () => {
    it('should handle multiple attributes together', () => {
      // Note: !flag must be at the end per parser design
      const result = parseQuickAdd('Important task #Work @urgent ~30m tomorrow !flag');

      expect(result.title).toBe('Important task');
      expect(result.flagged).toBe(true);
      expect(result.estimatedMinutes).toBe(30);
      expect(result.projectName).toBe('Work');
      expect(result.tagNames).toContain('urgent');
      // Should be a date-only string
      expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

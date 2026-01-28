import { addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, startOfDay, addWeeks, addMonths, endOfWeek, endOfMonth, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday } from 'date-fns';

interface ParsedAction {
  title: string;
  dueDate?: string;
  deferDate?: string;
  flagged?: boolean;
  estimatedMinutes?: number;
  projectName?: string;
  tagNames?: string[];
}

const DAY_PARSERS: Record<string, (date: Date) => Date> = {
  monday: nextMonday,
  mon: nextMonday,
  tuesday: nextTuesday,
  tue: nextTuesday,
  wednesday: nextWednesday,
  wed: nextWednesday,
  thursday: nextThursday,
  thu: nextThursday,
  friday: nextFriday,
  fri: nextFriday,
  saturday: nextSaturday,
  sat: nextSaturday,
  sunday: nextSunday,
  sun: nextSunday,
};

const DAY_CHECKS: Record<string, (date: Date) => boolean> = {
  monday: isMonday, mon: isMonday,
  tuesday: isTuesday, tue: isTuesday,
  wednesday: isWednesday, wed: isWednesday,
  thursday: isThursday, thu: isThursday,
  friday: isFriday, fri: isFriday,
  saturday: isSaturday, sat: isSaturday,
  sunday: isSunday, sun: isSunday,
};

function parseRelativeDay(dayName: string, today: Date): Date {
  const lowerDay = dayName.toLowerCase();
  const getNext = DAY_PARSERS[lowerDay];
  const isToday = DAY_CHECKS[lowerDay];

  if (!getNext) return today;

  // If today is that day, return next week's
  if (isToday && isToday(today)) {
    return getNext(addDays(today, 1));
  }

  return getNext(today);
}

/**
 * Parse a quick add string with smart date and flag detection.
 *
 * Supported patterns:
 * - "task today" or "task !today" -> due today
 * - "task tomorrow" or "task !tomorrow" -> due tomorrow
 * - "task next week" or "task !nextweek" -> due next Monday
 * - "task next monday/tuesday/etc" -> due next occurrence of that day
 * - "task on friday" -> due this/next Friday
 * - "task in 3 days" -> due in 3 days
 * - "task in 2 weeks" -> due in 2 weeks
 * - "task in 1 month" -> due in 1 month
 * - "task end of week" -> due end of this week (Sunday)
 * - "task end of month" -> due end of this month
 * - "task !flag" or "task !f" -> flagged
 * - "task ~15m" or "task ~1h" -> estimated time
 * - "task #ProjectName" -> assign to project (returns name for lookup)
 * - "task @tagname" -> assign tag (returns name for lookup)
 * - "task defer tomorrow" or "task @defer tomorrow" -> defer until tomorrow
 */
export function parseQuickAdd(input: string): ParsedAction {
  let text = input.trim();
  const result: ParsedAction = { title: '', tagNames: [] };
  const today = startOfDay(new Date());

  // Extract flagged (!flag or !f at end or standalone)
  if (/\s!f(?:lag)?$/i.test(text) || /^!f(?:lag)?\s/i.test(text) || text === '!f' || text === '!flag') {
    result.flagged = true;
    text = text.replace(/\s?!f(?:lag)?\s?/gi, ' ').trim();
  }

  // Extract estimated time (~15m, ~1h, ~30min, ~2hours)
  const timeMatch = text.match(/~(\d+)\s*(m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?)/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      result.estimatedMinutes = value * 60;
    } else {
      result.estimatedMinutes = value;
    }
    text = text.replace(/~\d+\s*(?:m(?:in(?:ute)?s?)?|h(?:(?:ou)?rs?)?)/i, '').trim();
  }

  // Extract project (#ProjectName)
  const projectMatch = text.match(/#(\S+)/);
  if (projectMatch) {
    result.projectName = projectMatch[1];
    text = text.replace(/#\S+/, '').trim();
  }

  // Extract tags (@tagname) - but not @defer
  const tagMatches = text.match(/@(?!defer\b)(\S+)/gi);
  if (tagMatches) {
    result.tagNames = tagMatches.map(t => t.substring(1)); // Remove @
    text = text.replace(/@(?!defer\b)\S+/gi, '').trim();
  }

  // Extract defer date (defer tomorrow, defer next week, @defer tomorrow)
  const deferMatch = text.match(/(?:@)?defer\s+(today|tomorrow|next\s*week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);
  if (deferMatch) {
    const deferStr = deferMatch[1].toLowerCase().replace(/\s+/g, '');
    if (deferStr === 'today') {
      result.deferDate = today.toISOString();
    } else if (deferStr === 'tomorrow') {
      result.deferDate = addDays(today, 1).toISOString();
    } else if (deferStr === 'nextweek') {
      result.deferDate = nextMonday(today).toISOString();
    } else if (DAY_PARSERS[deferStr]) {
      result.deferDate = parseRelativeDay(deferStr, today).toISOString();
    }
    text = text.replace(/(?:@)?defer\s+(?:today|tomorrow|next\s*week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i, '').trim();
  }

  // Extract due date patterns
  const dayNames = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun';

  // "today" at end
  if (/\s(?:!)?today$/i.test(text) || text.toLowerCase() === 'today') {
    result.dueDate = today.toISOString();
    text = text.replace(/\s?(?:!)?today$/i, '').trim();
  }
  // "tomorrow" at end
  else if (/\s(?:!)?tomorrow$/i.test(text) || text.toLowerCase() === 'tomorrow') {
    result.dueDate = addDays(today, 1).toISOString();
    text = text.replace(/\s?(?:!)?tomorrow$/i, '').trim();
  }
  // "next week" at end
  else if (/\s(?:!)?next\s*week$/i.test(text)) {
    result.dueDate = nextMonday(today).toISOString();
    text = text.replace(/\s(?:!)?next\s*week$/i, '').trim();
  }
  // "next monday/tuesday/etc" at end
  else if (new RegExp(`\\snext\\s+(${dayNames})$`, 'i').test(text)) {
    const match = text.match(new RegExp(`\\snext\\s+(${dayNames})$`, 'i'));
    if (match) {
      result.dueDate = parseRelativeDay(match[1], today).toISOString();
      text = text.replace(new RegExp(`\\snext\\s+(?:${dayNames})$`, 'i'), '').trim();
    }
  }
  // "on monday/tuesday/etc" at end
  else if (new RegExp(`\\s(?:on\\s+)?(${dayNames})$`, 'i').test(text)) {
    const match = text.match(new RegExp(`\\s(?:on\\s+)?(${dayNames})$`, 'i'));
    if (match) {
      result.dueDate = parseRelativeDay(match[1], today).toISOString();
      text = text.replace(new RegExp(`\\s(?:on\\s+)?(?:${dayNames})$`, 'i'), '').trim();
    }
  }
  // "end of week" at end
  else if (/\s(?:end\s*of\s*week|eow)$/i.test(text)) {
    result.dueDate = endOfWeek(today, { weekStartsOn: 1 }).toISOString();
    text = text.replace(/\s(?:end\s*of\s*week|eow)$/i, '').trim();
  }
  // "end of month" at end
  else if (/\s(?:end\s*of\s*month|eom)$/i.test(text)) {
    result.dueDate = endOfMonth(today).toISOString();
    text = text.replace(/\s(?:end\s*of\s*month|eom)$/i, '').trim();
  }
  // "in X days"
  else if (/\sin\s+(\d+)\s*days?$/i.test(text)) {
    const match = text.match(/\sin\s+(\d+)\s*days?$/i);
    if (match) {
      result.dueDate = addDays(today, parseInt(match[1])).toISOString();
      text = text.replace(/\sin\s+\d+\s*days?$/i, '').trim();
    }
  }
  // "in X weeks"
  else if (/\sin\s+(\d+)\s*weeks?$/i.test(text)) {
    const match = text.match(/\sin\s+(\d+)\s*weeks?$/i);
    if (match) {
      result.dueDate = addWeeks(today, parseInt(match[1])).toISOString();
      text = text.replace(/\sin\s+\d+\s*weeks?$/i, '').trim();
    }
  }
  // "in X months"
  else if (/\sin\s+(\d+)\s*months?$/i.test(text)) {
    const match = text.match(/\sin\s+(\d+)\s*months?$/i);
    if (match) {
      result.dueDate = addMonths(today, parseInt(match[1])).toISOString();
      text = text.replace(/\sin\s+\d+\s*months?$/i, '').trim();
    }
  }

  // Clean up extra spaces
  result.title = text.replace(/\s+/g, ' ').trim();

  // Remove empty tagNames array if no tags
  if (result.tagNames && result.tagNames.length === 0) {
    delete result.tagNames;
  }

  return result;
}

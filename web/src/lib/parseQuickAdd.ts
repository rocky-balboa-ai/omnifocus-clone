import { addDays, nextMonday, startOfDay, addWeeks, addMonths } from 'date-fns';

interface ParsedAction {
  title: string;
  dueDate?: string;
  deferDate?: string;
  flagged?: boolean;
  estimatedMinutes?: number;
  projectName?: string;
}

/**
 * Parse a quick add string with smart date and flag detection.
 *
 * Supported patterns:
 * - "task today" or "task !today" -> due today
 * - "task tomorrow" or "task !tomorrow" -> due tomorrow
 * - "task next week" or "task !nextweek" -> due next Monday
 * - "task in 3 days" -> due in 3 days
 * - "task !flag" or "task !f" -> flagged
 * - "task ~15m" or "task ~1h" -> estimated time
 * - "task #ProjectName" -> assign to project (returns name for lookup)
 * - "task @defer tomorrow" -> defer until tomorrow
 */
export function parseQuickAdd(input: string): ParsedAction {
  let text = input.trim();
  const result: ParsedAction = { title: '' };
  const today = startOfDay(new Date());

  // Extract flagged (!flag or !f at end or standalone)
  if (/\s!f(?:lag)?$/i.test(text) || /^!f(?:lag)?\s/i.test(text)) {
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

  // Extract defer date (@defer tomorrow, @defer next week)
  const deferMatch = text.match(/@defer\s+(today|tomorrow|next\s*week)/i);
  if (deferMatch) {
    const deferStr = deferMatch[1].toLowerCase().replace(/\s+/g, '');
    if (deferStr === 'today') {
      result.deferDate = today.toISOString();
    } else if (deferStr === 'tomorrow') {
      result.deferDate = addDays(today, 1).toISOString();
    } else if (deferStr === 'nextweek') {
      result.deferDate = nextMonday(today).toISOString();
    }
    text = text.replace(/@defer\s+(?:today|tomorrow|next\s*week)/i, '').trim();
  }

  // Extract due date patterns
  // "today" at end
  if (/\s(?:!)?today$/i.test(text)) {
    result.dueDate = today.toISOString();
    text = text.replace(/\s(?:!)?today$/i, '').trim();
  }
  // "tomorrow" at end
  else if (/\s(?:!)?tomorrow$/i.test(text)) {
    result.dueDate = addDays(today, 1).toISOString();
    text = text.replace(/\s(?:!)?tomorrow$/i, '').trim();
  }
  // "next week" at end
  else if (/\s(?:!)?next\s*week$/i.test(text)) {
    result.dueDate = nextMonday(today).toISOString();
    text = text.replace(/\s(?:!)?next\s*week$/i, '').trim();
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

  return result;
}

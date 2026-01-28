'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Calendar,
  Flag,
  FolderKanban,
  Tag,
  Clock,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import {
  addDays,
  addWeeks,
  nextMonday,
  nextFriday,
  startOfDay,
  format,
} from 'date-fns';
import clsx from 'clsx';

interface ParsedTask {
  title: string;
  dueDate?: Date;
  flagged?: boolean;
  projectName?: string;
  tagNames?: string[];
  estimatedMinutes?: number;
  note?: string;
}

// Parse natural language input
function parseNaturalLanguage(input: string): ParsedTask {
  let title = input;
  let dueDate: Date | undefined;
  let flagged = false;
  let projectName: string | undefined;
  let tagNames: string[] = [];
  let estimatedMinutes: number | undefined;
  let note: string | undefined;

  const today = startOfDay(new Date());

  // Parse due dates with simple patterns first
  const simpleDatePatterns: [RegExp, Date][] = [
    [/\btoday\b/i, today],
    [/\btomorrow\b/i, addDays(today, 1)],
    [/\bmon(day)?\b/i, nextMonday(today)],
    [/\btue(sday)?\b/i, addDays(nextMonday(today), 1)],
    [/\bwed(nesday)?\b/i, addDays(nextMonday(today), 2)],
    [/\bthu(rsday)?\b/i, addDays(nextMonday(today), 3)],
    [/\bfri(day)?\b/i, nextFriday(today)],
    [/\bnext week\b/i, nextMonday(today)],
  ];

  for (const [pattern, date] of simpleDatePatterns) {
    if (pattern.test(title)) {
      dueDate = date;
      title = title.replace(pattern, '').trim();
      break;
    }
  }

  // Parse relative date patterns with captures
  if (!dueDate) {
    const daysMatch = title.match(/\bin (\d+) days?\b/i);
    if (daysMatch) {
      dueDate = addDays(today, parseInt(daysMatch[1]));
      title = title.replace(/\bin \d+ days?\b/i, '').trim();
    }
    const weeksMatch = title.match(/\bin (\d+) weeks?\b/i);
    if (weeksMatch) {
      dueDate = addWeeks(today, parseInt(weeksMatch[1]));
      title = title.replace(/\bin \d+ weeks?\b/i, '').trim();
    }
  }

  // Parse flags
  if (/\!{1,3}$/.test(title) || /\bflagged?\b/i.test(title) || /\bimportant\b/i.test(title) || /\burgent\b/i.test(title)) {
    flagged = true;
    title = title.replace(/\!+$/, '').replace(/\b(flagged?|important|urgent)\b/gi, '').trim();
  }

  // Parse project with #
  const projectMatch = title.match(/#(\w+(?:\s\w+)*)/);
  if (projectMatch) {
    projectName = projectMatch[1];
    title = title.replace(/#\w+(?:\s\w+)*/, '').trim();
  }

  // Parse tags with @
  const tagMatches = title.matchAll(/@(\w+)/g);
  for (const match of tagMatches) {
    tagNames.push(match[1]);
    title = title.replace(match[0], '').trim();
  }

  // Parse time estimates
  const timeMatch = title.match(/\b(\d+)\s*(min|minute|m|hour|h|hr)\b/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      estimatedMinutes = value * 60;
    } else {
      estimatedMinutes = value;
    }
    title = title.replace(timeMatch[0], '').trim();
  }

  // Parse note with //
  const noteMatch = title.match(/\/\/(.+)$/);
  if (noteMatch) {
    note = noteMatch[1].trim();
    title = title.replace(/\/\/.+$/, '').trim();
  }

  // Clean up title
  title = title.replace(/\s+/g, ' ').trim();

  return {
    title,
    dueDate,
    flagged,
    projectName,
    tagNames: tagNames.length > 0 ? tagNames : undefined,
    estimatedMinutes,
    note,
  };
}

interface NaturalLanguageInputProps {
  onSubmit: (task: ParsedTask) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NaturalLanguageInput({
  onSubmit,
  placeholder = "Add task... (try 'Call mom tomorrow @family #personal!')",
  autoFocus = false,
}: NaturalLanguageInputProps) {
  const { theme } = useAppStore();
  const [value, setValue] = useState('');
  const [preview, setPreview] = useState<ParsedTask | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim()) {
      setPreview(parseNaturalLanguage(value));
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !preview) return;

    onSubmit(preview);
    setValue('');
    setPreview(null);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className={clsx(
          'flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border focus-within:border-omnifocus-purple'
            : 'bg-white border-gray-200 focus-within:border-omnifocus-purple'
        )}>
          <Sparkles size={18} className="text-omnifocus-purple shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={clsx(
              'flex-1 bg-transparent outline-none text-sm',
              theme === 'dark'
                ? 'text-white placeholder-gray-500'
                : 'text-gray-900 placeholder-gray-400'
            )}
          />
          {value.trim() && (
            <button
              type="submit"
              className="flex items-center gap-1 px-2 py-1 rounded bg-omnifocus-purple text-white text-sm hover:bg-omnifocus-purple/90 transition-colors"
            >
              <CornerDownLeft size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Live Preview */}
      {preview && preview.title && (
        <div className={clsx(
          'mt-2 p-3 rounded-lg border text-sm',
          theme === 'dark'
            ? 'bg-omnifocus-bg border-omnifocus-border'
            : 'bg-gray-50 border-gray-200'
        )}>
          <div className={clsx(
            'font-medium mb-2',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {preview.title}
          </div>
          <div className="flex flex-wrap gap-2">
            {preview.dueDate && (
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                theme === 'dark'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-600'
              )}>
                <Calendar size={12} />
                {format(preview.dueDate, 'MMM d')}
              </span>
            )}
            {preview.flagged && (
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                'bg-omnifocus-orange/20 text-omnifocus-orange'
              )}>
                <Flag size={12} />
                Flagged
              </span>
            )}
            {preview.projectName && (
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                theme === 'dark'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-purple-100 text-purple-600'
              )}>
                <FolderKanban size={12} />
                {preview.projectName}
              </span>
            )}
            {preview.tagNames?.map(tag => (
              <span
                key={tag}
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                  theme === 'dark'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-green-100 text-green-600'
                )}
              >
                <Tag size={12} />
                {tag}
              </span>
            ))}
            {preview.estimatedMinutes && (
              <span className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                theme === 'dark'
                  ? 'bg-gray-500/20 text-gray-400'
                  : 'bg-gray-100 text-gray-600'
              )}>
                <Clock size={12} />
                {preview.estimatedMinutes >= 60
                  ? `${Math.floor(preview.estimatedMinutes / 60)}h${preview.estimatedMinutes % 60 > 0 ? ` ${preview.estimatedMinutes % 60}m` : ''}`
                  : `${preview.estimatedMinutes}m`}
              </span>
            )}
          </div>
          {preview.note && (
            <div className={clsx(
              'mt-2 text-xs italic',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              Note: {preview.note}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {!preview && (
        <div className={clsx(
          'mt-2 text-xs',
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        )}>
          <span className="font-medium">Tips:</span>{' '}
          <span className="opacity-75">
            @tag #project today/tomorrow/monday 30min ! (flag) // note
          </span>
        </div>
      )}
    </div>
  );
}

export { parseNaturalLanguage };
export type { ParsedTask };

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  isAfter,
  isBefore,
  startOfDay,
  subDays,
  startOfYear,
  endOfYear,
} from 'date-fns';
import clsx from 'clsx';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  showPresets?: boolean;
  className?: string;
}

interface Preset {
  label: string;
  range: DateRange;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  minDate,
  maxDate,
  showPresets = true,
  className,
}: DateRangePickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value.start || new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Presets
  const presets: Preset[] = useMemo(() => {
    const today = startOfDay(new Date());
    return [
      { label: 'Today', range: { start: today, end: today } },
      { label: 'Yesterday', range: { start: subDays(today, 1), end: subDays(today, 1) } },
      { label: 'Last 7 days', range: { start: subDays(today, 6), end: today } },
      { label: 'Last 30 days', range: { start: subDays(today, 29), end: today } },
      { label: 'This month', range: { start: startOfMonth(today), end: endOfMonth(today) } },
      { label: 'This year', range: { start: startOfYear(today), end: endOfYear(today) } },
    ];
  }, []);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [viewMonth]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  const handleDayClick = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return;
    if (maxDate && isAfter(date, maxDate)) return;

    if (!selectingEnd || !value.start) {
      // Selecting start date
      onChange({ start: date, end: null });
      setSelectingEnd(true);
    } else {
      // Selecting end date
      if (isBefore(date, value.start)) {
        // If selected date is before start, swap them
        onChange({ start: date, end: value.start });
      } else {
        onChange({ start: value.start, end: date });
      }
      setSelectingEnd(false);
      setIsOpen(false);
    }
  };

  const handlePresetClick = (preset: Preset) => {
    onChange(preset.range);
    setIsOpen(false);
    setSelectingEnd(false);
  };

  const clearRange = () => {
    onChange({ start: null, end: null });
    setSelectingEnd(false);
  };

  const isInRange = (date: Date) => {
    if (!value.start) return false;

    const endDate = selectingEnd ? (hoverDate || value.end) : value.end;
    if (!endDate) return false;

    const start = isBefore(value.start, endDate) ? value.start : endDate;
    const end = isBefore(value.start, endDate) ? endDate : value.start;

    return isWithinInterval(date, { start, end });
  };

  const isRangeStart = (date: Date) => value.start && isSameDay(date, value.start);
  const isRangeEnd = (date: Date) => value.end && isSameDay(date, value.end);

  const formatDisplayValue = () => {
    if (!value.start) return placeholder;
    if (!value.end) return format(value.start, 'MMM d, yyyy');
    return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors w-full',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border text-white hover:border-gray-600'
            : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
        )}
      >
        <Calendar size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
        <span className={clsx(
          'flex-1 text-left',
          !value.start && (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
        )}>
          {formatDisplayValue()}
        </span>
        {value.start && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearRange();
            }}
            className={clsx(
              'p-0.5 rounded hover:bg-gray-500/20',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            <X size={14} />
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 rounded-xl shadow-2xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <div className="flex">
            {/* Presets */}
            {showPresets && (
              <div className={clsx(
                'w-36 p-2 border-r',
                theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
              )}>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className={clsx(
                      'w-full px-3 py-1.5 text-sm text-left rounded-md transition-colors',
                      theme === 'dark'
                        ? 'text-gray-300 hover:bg-omnifocus-surface'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className={clsx(
                    'p-1 rounded-md transition-colors',
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className={clsx(
                  'text-sm font-medium',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {format(viewMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className={clsx(
                    'p-1 rounded-md transition-colors',
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div
                    key={day}
                    className={clsx(
                      'w-8 h-8 flex items-center justify-center text-xs font-medium',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  const isSelected = isRangeStart(day) || isRangeEnd(day);
                  const inRange = isInRange(day);
                  const isDisabled = (minDate && isBefore(day, minDate)) ||
                    (maxDate && isAfter(day, maxDate));

                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => selectingEnd && setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                      disabled={isDisabled}
                      className={clsx(
                        'w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors',
                        isDisabled && 'opacity-30 cursor-not-allowed',
                        !isCurrentMonth && (theme === 'dark' ? 'text-gray-600' : 'text-gray-300'),
                        isCurrentMonth && !isSelected && !inRange && (
                          theme === 'dark'
                            ? 'text-gray-300 hover:bg-omnifocus-surface'
                            : 'text-gray-700 hover:bg-gray-100'
                        ),
                        inRange && !isSelected && (
                          theme === 'dark'
                            ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                            : 'bg-purple-100 text-purple-700'
                        ),
                        isSelected && 'bg-omnifocus-purple text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Selection hint */}
              <p className={clsx(
                'text-xs mt-3 text-center',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {selectingEnd ? 'Select end date' : 'Select start date'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact date range display
interface DateRangeDisplayProps {
  range: DateRange;
  className?: string;
}

export function DateRangeDisplay({ range, className }: DateRangeDisplayProps) {
  const { theme } = useAppStore();

  if (!range.start) {
    return (
      <span className={clsx(
        'text-sm',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
        className
      )}>
        No date range
      </span>
    );
  }

  return (
    <span className={clsx(
      'text-sm',
      theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
      className
    )}>
      {range.end
        ? `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`
        : format(range.start, 'MMM d, yyyy')
      }
    </span>
  );
}

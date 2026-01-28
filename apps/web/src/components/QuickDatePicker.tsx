'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  nextMonday,
  nextFriday,
} from 'date-fns';
import clsx from 'clsx';

const QUICK_OPTIONS = [
  { label: 'Today', getValue: () => startOfDay(new Date()) },
  { label: 'Tomorrow', getValue: () => addDays(startOfDay(new Date()), 1) },
  { label: 'This Friday', getValue: () => nextFriday(startOfDay(new Date())) },
  { label: 'Next Monday', getValue: () => nextMonday(startOfDay(new Date())) },
  { label: 'Next Week', getValue: () => addDays(startOfDay(new Date()), 7) },
  { label: 'In 2 Weeks', getValue: () => addDays(startOfDay(new Date()), 14) },
  { label: 'Next Month', getValue: () => addMonths(startOfDay(new Date()), 1) },
];

interface QuickDatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  showClear?: boolean;
  minDate?: Date;
  className?: string;
}

export function QuickDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  showClear = true,
  minDate,
  className,
}: QuickDatePickerProps) {
  const { theme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (date: Date) => {
    onChange(date.toISOString());
    setIsOpen(false);
    setShowCalendar(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  // Generate calendar days
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    return false;
  };

  return (
    <div ref={containerRef} className={clsx('relative inline-block', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
          selectedDate
            ? theme === 'dark'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-blue-100 text-blue-600'
            : theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900'
        )}
      >
        <Calendar size={14} />
        <span>
          {selectedDate
            ? isToday(selectedDate)
              ? 'Today'
              : format(selectedDate, 'MMM d, yyyy')
            : placeholder}
        </span>
        <ChevronDown size={14} className={clsx(isOpen && 'rotate-180', 'transition-transform')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={clsx(
          'absolute top-full left-0 mt-1 rounded-xl shadow-xl border overflow-hidden z-50',
          'animate-in fade-in slide-in-from-top-2 duration-150',
          showCalendar ? 'w-72' : 'w-48',
          theme === 'dark'
            ? 'bg-omnifocus-sidebar border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          {showCalendar ? (
            // Calendar view
            <div className="p-3">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className={clsx(
                    'p-1 rounded transition-colors',
                    theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
                  )}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={clsx(
                  'font-medium',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {format(viewMonth, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className={clsx(
                    'p-1 rounded transition-colors',
                    theme === 'dark' ? 'hover:bg-omnifocus-surface' : 'hover:bg-gray-100'
                  )}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div
                    key={day}
                    className={clsx(
                      'text-center text-xs font-medium py-1',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(day => {
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const disabled = isDateDisabled(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !disabled && handleSelect(day)}
                      disabled={disabled}
                      className={clsx(
                        'w-8 h-8 rounded-full text-sm transition-colors',
                        isSelected
                          ? 'bg-omnifocus-purple text-white'
                          : isTodayDate
                            ? theme === 'dark'
                              ? 'bg-omnifocus-surface text-omnifocus-purple font-medium'
                              : 'bg-purple-100 text-omnifocus-purple font-medium'
                            : isCurrentMonth
                              ? disabled
                                ? theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                                : theme === 'dark'
                                  ? 'text-gray-300 hover:bg-omnifocus-surface'
                                  : 'text-gray-700 hover:bg-gray-100'
                              : theme === 'dark'
                                ? 'text-gray-600'
                                : 'text-gray-300'
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

              {/* Back to presets */}
              <button
                onClick={() => setShowCalendar(false)}
                className={clsx(
                  'w-full mt-3 py-2 text-sm rounded-lg transition-colors',
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white hover:bg-omnifocus-surface'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                Back to quick options
              </button>
            </div>
          ) : (
            // Quick options
            <div className="p-2">
              {/* Clear option */}
              {showClear && selectedDate && (
                <button
                  onClick={handleClear}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors mb-1',
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-omnifocus-surface'
                      : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <X size={14} />
                  Clear date
                </button>
              )}

              {QUICK_OPTIONS.map((option, i) => {
                const date = option.getValue();
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(date)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-1.5 rounded text-sm text-left transition-colors',
                      isSelected
                        ? theme === 'dark'
                          ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                          : 'bg-omnifocus-purple/10 text-omnifocus-purple'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-surface'
                          : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span>{option.label}</span>
                    <span className={clsx(
                      'text-xs',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {format(date, 'MMM d')}
                    </span>
                  </button>
                );
              })}

              {/* Open calendar */}
              <button
                onClick={() => setShowCalendar(true)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left transition-colors mt-1 border-t',
                  theme === 'dark'
                    ? 'text-omnifocus-purple hover:bg-omnifocus-surface border-omnifocus-border'
                    : 'text-omnifocus-purple hover:bg-gray-100 border-gray-200'
                )}
              >
                <Calendar size={14} />
                Pick from calendar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

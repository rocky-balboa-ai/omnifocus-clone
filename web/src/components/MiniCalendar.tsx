'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
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
} from 'date-fns';
import clsx from 'clsx';

interface MiniCalendarProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  markedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  markedDates = [],
  minDate,
  maxDate,
  className,
}: MiniCalendarProps) {
  const { theme } = useAppStore();
  const [viewMonth, setViewMonth] = useState(selectedDate || new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [viewMonth]);

  // Create a set of marked date strings for quick lookup
  const markedDateSet = useMemo(() => {
    return new Set(markedDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [markedDates]);

  const isDateDisabled = (date: Date) => {
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), date)) return true;
    return false;
  };

  const isDateMarked = (date: Date) => {
    return markedDateSet.has(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className={clsx(
      'rounded-xl border p-3',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200',
      className
    )}>
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className={clsx(
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-bg text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          )}
        >
          <ChevronLeft size={16} />
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
            'p-1 rounded transition-colors',
            theme === 'dark'
              ? 'hover:bg-omnifocus-bg text-gray-400 hover:text-white'
              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={i}
            className={clsx(
              'text-center text-[10px] font-medium py-0.5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const disabled = isDateDisabled(day);
          const marked = isDateMarked(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabled && onSelectDate?.(day)}
              disabled={disabled}
              className={clsx(
                'relative w-7 h-7 rounded-full text-xs transition-colors',
                isSelected
                  ? 'bg-omnifocus-purple text-white'
                  : isTodayDate
                    ? theme === 'dark'
                      ? 'bg-omnifocus-bg text-omnifocus-purple font-medium'
                      : 'bg-purple-100 text-omnifocus-purple font-medium'
                    : isCurrentMonth
                      ? disabled
                        ? theme === 'dark' ? 'text-gray-700' : 'text-gray-300'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-omnifocus-bg'
                          : 'text-gray-700 hover:bg-gray-100'
                      : theme === 'dark'
                        ? 'text-gray-600'
                        : 'text-gray-300',
                !disabled && 'cursor-pointer'
              )}
            >
              {format(day, 'd')}
              {marked && !isSelected && (
                <span className={clsx(
                  'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                  isTodayDate ? 'bg-omnifocus-purple' : 'bg-omnifocus-orange'
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <button
        onClick={() => {
          setViewMonth(new Date());
          onSelectDate?.(startOfDay(new Date()));
        }}
        className={clsx(
          'w-full mt-2 py-1 text-xs font-medium rounded transition-colors',
          theme === 'dark'
            ? 'text-omnifocus-purple hover:bg-omnifocus-bg'
            : 'text-omnifocus-purple hover:bg-gray-100'
        )}
      >
        Today
      </button>
    </div>
  );
}

// Compact inline calendar for sidebar
interface SidebarCalendarProps {
  onSelectDate?: (date: Date) => void;
  markedDates?: Date[];
  className?: string;
}

export function SidebarCalendar({
  onSelectDate,
  markedDates = [],
  className,
}: SidebarCalendarProps) {
  const { theme, actions } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get dates with tasks
  const datesWithTasks = useMemo(() => {
    return actions
      .filter(a => a.dueDate && a.status === 'active')
      .map(a => new Date(a.dueDate!));
  }, [actions]);

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  // Count tasks for selected date
  const tasksOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return actions.filter(a =>
      a.dueDate &&
      a.status === 'active' &&
      isSameDay(new Date(a.dueDate), selectedDate)
    );
  }, [selectedDate, actions]);

  return (
    <div className={className}>
      <MiniCalendar
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        markedDates={datesWithTasks}
      />

      {/* Selected date tasks preview */}
      {selectedDate && tasksOnSelectedDate.length > 0 && (
        <div className={clsx(
          'mt-2 p-2 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
        )}>
          <p className={clsx(
            'text-xs font-medium mb-1',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {format(selectedDate, 'EEEE, MMM d')}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {tasksOnSelectedDate.length} task{tasksOnSelectedDate.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// Week view mini calendar
interface WeekViewCalendarProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  markedDates?: Date[];
  className?: string;
}

export function WeekViewCalendar({
  selectedDate,
  onSelectDate,
  markedDates = [],
  className,
}: WeekViewCalendarProps) {
  const { theme } = useAppStore();
  const today = new Date();

  // Get days of current week
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, []);

  const markedDateSet = useMemo(() => {
    return new Set(markedDates.map(d => format(d, 'yyyy-MM-dd')));
  }, [markedDates]);

  const isDateMarked = (date: Date) => {
    return markedDateSet.has(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className={clsx(
      'flex items-center justify-between rounded-lg p-2',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      {weekDays.map(day => {
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        const marked = isDateMarked(day);

        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate?.(day)}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
              isSelected
                ? 'bg-omnifocus-purple text-white'
                : isTodayDate
                  ? theme === 'dark'
                    ? 'bg-omnifocus-bg text-omnifocus-purple'
                    : 'bg-white text-omnifocus-purple shadow-sm'
                  : theme === 'dark'
                    ? 'hover:bg-omnifocus-bg text-gray-400 hover:text-white'
                    : 'hover:bg-white text-gray-600 hover:text-gray-900'
            )}
          >
            <span className="text-[10px] font-medium uppercase">
              {format(day, 'EEE')}
            </span>
            <span className={clsx(
              'text-sm font-semibold',
              isSelected && 'text-white'
            )}>
              {format(day, 'd')}
            </span>
            {marked && !isSelected && (
              <span className="w-1 h-1 rounded-full bg-omnifocus-orange" />
            )}
          </button>
        );
      })}
    </div>
  );
}

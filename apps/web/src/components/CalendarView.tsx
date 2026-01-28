'use client';

import { useState, useMemo } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  AlertTriangle,
  Plus,
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
  isToday,
  isPast,
  addMonths,
  subMonths,
} from 'date-fns';
import clsx from 'clsx';

interface CalendarViewProps {
  onSelectDate?: (date: Date) => void;
  onSelectAction?: (action: Action) => void;
}

export function CalendarView({ onSelectDate, onSelectAction }: CalendarViewProps) {
  const { actions, theme, setSelectedAction, setQuickEntryOpen } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group actions by date
  const actionsByDate = useMemo(() => {
    const map = new Map<string, Action[]>();

    actions.forEach(action => {
      if (action.status !== 'active') return;

      // Add by due date
      if (action.dueDate) {
        const dateKey = format(new Date(action.dueDate), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, action]);
      }

      // Add by defer date (different styling)
      if (action.deferDate) {
        const dateKey = format(new Date(action.deferDate), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        if (!existing.some(a => a.id === action.id)) {
          map.set(dateKey, [...existing, action]);
        }
      }
    });

    return map;
  }, [actions]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onSelectDate?.(date);
  };

  const handleActionClick = (action: Action, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAction(action.id);
    onSelectAction?.(action);
  };

  const selectedDateActions = selectedDate
    ? actionsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-3 border-b',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-bg text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            )}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className={clsx(
            'text-lg font-semibold min-w-[160px] text-center',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={handleNextMonth}
            className={clsx(
              'p-1 rounded transition-colors',
              theme === 'dark'
                ? 'hover:bg-omnifocus-bg text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            )}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={handleToday}
          className={clsx(
            'px-3 py-1 rounded-lg text-sm transition-colors',
            theme === 'dark'
              ? 'bg-omnifocus-bg text-gray-300 hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div
              key={day}
              className={clsx(
                'text-xs font-medium text-center py-2',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayActions = actionsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            const hasOverdue = dayActions.some(a =>
              a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
            );
            const hasFlagged = dayActions.some(a => a.flagged);

            return (
              <button
                key={dateKey}
                onClick={() => handleDateClick(day)}
                className={clsx(
                  'relative p-1 min-h-[60px] rounded-lg transition-colors text-left',
                  isSelected
                    ? 'bg-omnifocus-purple/20 ring-2 ring-omnifocus-purple'
                    : isCurrentDay
                      ? theme === 'dark'
                        ? 'bg-omnifocus-purple/10'
                        : 'bg-purple-50'
                      : theme === 'dark'
                        ? 'hover:bg-omnifocus-bg'
                        : 'hover:bg-gray-50',
                  !isCurrentMonth && 'opacity-40'
                )}
              >
                <div className={clsx(
                  'text-sm font-medium mb-1',
                  isCurrentDay
                    ? 'text-omnifocus-purple'
                    : theme === 'dark'
                      ? 'text-white'
                      : 'text-gray-900'
                )}>
                  {format(day, 'd')}
                </div>

                {/* Action indicators */}
                <div className="space-y-0.5">
                  {dayActions.slice(0, 2).map(action => (
                    <div
                      key={action.id}
                      onClick={(e) => handleActionClick(action, e)}
                      className={clsx(
                        'text-[10px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors',
                        action.dueDate && isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate))
                          ? 'bg-red-500/20 text-red-400'
                          : action.flagged
                            ? 'bg-orange-500/20 text-orange-400'
                            : theme === 'dark'
                              ? 'bg-omnifocus-bg text-gray-300 hover:bg-omnifocus-border'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {action.title}
                    </div>
                  ))}
                  {dayActions.length > 2 && (
                    <div className={clsx(
                      'text-[10px] text-center',
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      +{dayActions.length - 2} more
                    </div>
                  )}
                </div>

                {/* Status indicators */}
                {(hasOverdue || hasFlagged) && dayActions.length === 0 && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {hasOverdue && <AlertTriangle size={10} className="text-red-400" />}
                    {hasFlagged && <Flag size={10} className="text-orange-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className={clsx(
          'border-t p-4',
          theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={clsx(
              'text-sm font-semibold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </h4>
            <button
              onClick={() => setQuickEntryOpen(true)}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                theme === 'dark'
                  ? 'bg-omnifocus-purple/20 text-omnifocus-purple hover:bg-omnifocus-purple/30'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              )}
            >
              <Plus size={12} />
              Add
            </button>
          </div>

          {selectedDateActions.length > 0 ? (
            <ul className="space-y-2">
              {selectedDateActions.map(action => (
                <li
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                    theme === 'dark'
                      ? 'bg-omnifocus-bg hover:bg-omnifocus-border'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  {action.dueDate && isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate)) ? (
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  ) : action.flagged ? (
                    <Flag size={14} className="text-orange-400 shrink-0" />
                  ) : (
                    <Calendar size={14} className="text-omnifocus-purple shrink-0" />
                  )}
                  <span className={clsx(
                    'text-sm flex-1 truncate',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {action.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={clsx(
              'text-sm text-center py-4',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              No tasks scheduled for this day
            </p>
          )}
        </div>
      )}
    </div>
  );
}

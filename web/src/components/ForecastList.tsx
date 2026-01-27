'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { CalendarView } from './CalendarView';
import { Calendar, Plus, Search, Eye, EyeOff, List, CalendarDays } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, startOfDay, addDays, isBefore, isAfter } from 'date-fns';
import clsx from 'clsx';

export function ForecastList() {
  const { actions, isLoading, setQuickEntryOpen, setSearchOpen, showCompleted, setShowCompleted, theme } = useAppStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const completedCount = actions.filter(a => a.dueDate && a.status === 'completed').length;

  // Group actions by date
  const groupedActions = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    const shouldInclude = (a: typeof actions[0]) => showCompleted || a.status !== 'completed';

    const groups: { title: string; actions: typeof actions; color?: string }[] = [];

    // Overdue
    const overdue = actions.filter(
      a => a.dueDate && isBefore(new Date(a.dueDate), today) && shouldInclude(a)
    );
    if (overdue.length > 0) {
      groups.push({ title: 'Overdue', actions: overdue, color: 'text-red-400' });
    }

    // Today
    const todayActions = actions.filter(
      a => a.dueDate && isToday(new Date(a.dueDate)) && shouldInclude(a)
    );
    if (todayActions.length > 0) {
      groups.push({ title: 'Today', actions: todayActions, color: 'text-omnifocus-orange' });
    }

    // Tomorrow
    const tomorrowActions = actions.filter(
      a => a.dueDate && isTomorrow(new Date(a.dueDate)) && shouldInclude(a)
    );
    if (tomorrowActions.length > 0) {
      groups.push({ title: 'Tomorrow', actions: tomorrowActions });
    }

    // This week (excluding today and tomorrow)
    const thisWeekActions = actions.filter(a => {
      if (!a.dueDate || !shouldInclude(a)) return false;
      const dueDate = new Date(a.dueDate);
      return isAfter(dueDate, tomorrow) && isBefore(dueDate, nextWeek);
    });
    if (thisWeekActions.length > 0) {
      groups.push({ title: 'This Week', actions: thisWeekActions });
    }

    // Future (beyond this week)
    const futureActions = actions.filter(a => {
      if (!a.dueDate || !shouldInclude(a)) return false;
      return isAfter(new Date(a.dueDate), nextWeek);
    });
    if (futureActions.length > 0) {
      groups.push({ title: 'Later', actions: futureActions });
    }

    // No due date
    const noDueDate = actions.filter(
      a => !a.dueDate && shouldInclude(a)
    );
    if (noDueDate.length > 0) {
      groups.push({ title: 'No Due Date', actions: noDueDate, color: 'text-gray-500' });
    }

    return groups;
  }, [actions, showCompleted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  const totalWithDueDate = actions.filter(a => a.dueDate && a.status !== 'completed').length;

  return (
    <div className="h-full flex flex-col">
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top flex items-center justify-between gap-3',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3 flex-1">
          <Calendar size={24} className="text-omnifocus-purple" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Forecast
          </h2>
        </div>

        {/* View mode toggle */}
        <div className={clsx(
          'flex items-center rounded-lg overflow-hidden',
          theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
        )}>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 transition-colors',
              viewMode === 'list'
                ? 'bg-omnifocus-purple text-white'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
            )}
            title="List view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={clsx(
              'p-2 transition-colors',
              viewMode === 'calendar'
                ? 'bg-omnifocus-purple text-white'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-900'
            )}
            title="Calendar view"
          >
            <CalendarDays size={16} />
          </button>
        </div>

        {/* Show/Hide Completed toggle */}
        {completedCount > 0 && viewMode === 'list' && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
              showCompleted
                ? 'bg-omnifocus-purple/20 text-omnifocus-purple'
                : theme === 'dark'
                  ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
            title={showCompleted ? 'Hide completed' : 'Show completed'}
          >
            {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden md:inline">{completedCount}</span>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm',
            theme === 'dark'
              ? 'bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border'
              : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          )}
        >
          <Search size={16} />
          <kbd className={clsx(
            'hidden md:inline px-1.5 py-0.5 text-xs rounded',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white border border-gray-200'
          )}>⌘K</kbd>
        </button>

        <button
          onClick={() => setQuickEntryOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-purple text-white hover:bg-omnifocus-purple/90 transition-colors text-sm"
        >
          <Plus size={16} />
          <span>New Action</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {viewMode === 'calendar' ? (
          <CalendarView />
        ) : groupedActions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No scheduled actions</p>
            <p className="text-sm text-gray-600 mt-1">
              Add due dates to your actions to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActions.map(group => (
              <div key={group.title}>
                <h3 className={`text-sm font-semibold mb-2 ${group.color || 'text-gray-400'}`}>
                  {group.title}
                  <span className="ml-2 text-gray-500 font-normal">
                    ({group.actions.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {group.actions.map(action => (
                    <ActionItem key={action.id} action={action} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

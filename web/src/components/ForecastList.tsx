'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { Calendar, Plus, Search } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, startOfDay, addDays, isBefore, isAfter } from 'date-fns';

export function ForecastList() {
  const { actions, isLoading, setQuickEntryOpen, setSearchOpen } = useAppStore();

  // Group actions by date
  const groupedActions = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    const groups: { title: string; actions: typeof actions; color?: string }[] = [];

    // Overdue
    const overdue = actions.filter(
      a => a.dueDate && isBefore(new Date(a.dueDate), today) && a.status !== 'completed'
    );
    if (overdue.length > 0) {
      groups.push({ title: 'Overdue', actions: overdue, color: 'text-red-400' });
    }

    // Today
    const todayActions = actions.filter(
      a => a.dueDate && isToday(new Date(a.dueDate)) && a.status !== 'completed'
    );
    if (todayActions.length > 0) {
      groups.push({ title: 'Today', actions: todayActions, color: 'text-omnifocus-orange' });
    }

    // Tomorrow
    const tomorrowActions = actions.filter(
      a => a.dueDate && isTomorrow(new Date(a.dueDate)) && a.status !== 'completed'
    );
    if (tomorrowActions.length > 0) {
      groups.push({ title: 'Tomorrow', actions: tomorrowActions });
    }

    // This week (excluding today and tomorrow)
    const thisWeekActions = actions.filter(a => {
      if (!a.dueDate || a.status === 'completed') return false;
      const dueDate = new Date(a.dueDate);
      return isAfter(dueDate, tomorrow) && isBefore(dueDate, nextWeek);
    });
    if (thisWeekActions.length > 0) {
      groups.push({ title: 'This Week', actions: thisWeekActions });
    }

    // Future (beyond this week)
    const futureActions = actions.filter(a => {
      if (!a.dueDate || a.status === 'completed') return false;
      return isAfter(new Date(a.dueDate), nextWeek);
    });
    if (futureActions.length > 0) {
      groups.push({ title: 'Later', actions: futureActions });
    }

    // No due date
    const noDueDate = actions.filter(
      a => !a.dueDate && a.status !== 'completed'
    );
    if (noDueDate.length > 0) {
      groups.push({ title: 'No Due Date', actions: noDueDate, color: 'text-gray-500' });
    }

    return groups;
  }, [actions]);

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
      <header className="px-4 md:px-6 py-3 md:py-4 border-b border-omnifocus-border safe-area-top flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Calendar size={24} className="text-omnifocus-purple" />
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Forecast
          </h2>
        </div>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-omnifocus-surface text-gray-400 hover:text-white hover:bg-omnifocus-border transition-colors text-sm"
        >
          <Search size={16} />
          <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-omnifocus-bg rounded">⌘K</kbd>
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
        {groupedActions.length === 0 ? (
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

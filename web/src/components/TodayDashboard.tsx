'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { ActionItem } from './ActionItem';
import { StreakCounter } from './StreakCounter';
import {
  Sun,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Calendar,
  Plus,
  Search,
} from 'lucide-react';
import { isToday, isPast, startOfDay, isBefore } from 'date-fns';
import clsx from 'clsx';

export function TodayDashboard() {
  const {
    actions,
    isLoading,
    setQuickEntryOpen,
    setSearchOpen,
    theme,
  } = useAppStore();

  const today = startOfDay(new Date());

  // Calculate sections
  const sections = useMemo(() => {
    const overdue = actions.filter(a =>
      a.status === 'active' &&
      a.dueDate &&
      isBefore(new Date(a.dueDate), today)
    );

    const dueToday = actions.filter(a =>
      a.status === 'active' &&
      a.dueDate &&
      isToday(new Date(a.dueDate))
    );

    const flagged = actions.filter(a =>
      a.status === 'active' &&
      a.flagged &&
      !a.dueDate // Only show flagged items without due dates here
    );

    const completedToday = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isToday(new Date(a.completedAt))
    );

    return { overdue, dueToday, flagged, completedToday };
  }, [actions, today]);

  const totalTasks = sections.overdue.length + sections.dueToday.length + sections.flagged.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-omnifocus-purple"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className={clsx(
        'px-4 md:px-6 py-3 md:py-4 border-b safe-area-top flex items-center justify-between gap-3',
        theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
      )}>
        <div className="flex items-center gap-3 flex-1">
          <Sun size={24} className="text-omnifocus-orange" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Today
          </h2>
        </div>

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
        {/* Streak Counter */}
        <div className="mb-4">
          <StreakCounter />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={clsx(
            'p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-400" />
              <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Overdue</span>
            </div>
            <p className={clsx(
              'text-2xl font-bold',
              sections.overdue.length > 0 ? 'text-red-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            )}>
              {sections.overdue.length}
            </p>
          </div>

          <div className={clsx(
            'p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-omnifocus-orange" />
              <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Due Today</span>
            </div>
            <p className={clsx(
              'text-2xl font-bold',
              sections.dueToday.length > 0 ? 'text-omnifocus-orange' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            )}>
              {sections.dueToday.length}
            </p>
          </div>

          <div className={clsx(
            'p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <Flag size={18} className="text-omnifocus-orange" />
              <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Flagged</span>
            </div>
            <p className={clsx(
              'text-2xl font-bold',
              sections.flagged.length > 0 ? 'text-omnifocus-orange' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            )}>
              {sections.flagged.length}
            </p>
          </div>

          <div className={clsx(
            'p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} className="text-green-500" />
              <span className={clsx('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>Completed</span>
            </div>
            <p className={clsx(
              'text-2xl font-bold',
              sections.completedToday.length > 0 ? 'text-green-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            )}>
              {sections.completedToday.length}
            </p>
          </div>
        </div>

        {/* Task Sections */}
        {totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className={clsx(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
            )}>
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h3 className={clsx(
              'text-lg font-semibold mb-1',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              All clear for today!
            </h3>
            <p className={clsx(
              'text-sm text-center max-w-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              No overdue tasks, nothing due today, and no flagged items to work on.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overdue Section */}
            {sections.overdue.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-2">
                  <AlertTriangle size={16} />
                  Overdue
                  <span className="text-gray-500 font-normal">({sections.overdue.length})</span>
                </h3>
                <ul className="space-y-1">
                  {sections.overdue.map(action => (
                    <ActionItem key={action.id} action={action} />
                  ))}
                </ul>
              </section>
            )}

            {/* Due Today Section */}
            {sections.dueToday.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-omnifocus-orange mb-2">
                  <Calendar size={16} />
                  Due Today
                  <span className="text-gray-500 font-normal">({sections.dueToday.length})</span>
                </h3>
                <ul className="space-y-1">
                  {sections.dueToday.map(action => (
                    <ActionItem key={action.id} action={action} />
                  ))}
                </ul>
              </section>
            )}

            {/* Flagged Section */}
            {sections.flagged.length > 0 && (
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-omnifocus-orange mb-2">
                  <Flag size={16} />
                  Flagged
                  <span className="text-gray-500 font-normal">({sections.flagged.length})</span>
                </h3>
                <ul className="space-y-1">
                  {sections.flagged.map(action => (
                    <ActionItem key={action.id} action={action} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Completed Today */}
        {sections.completedToday.length > 0 && (
          <section className={clsx(
            'mt-8 pt-6 border-t',
            theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
          )}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-green-500 mb-2">
              <CheckCircle2 size={16} />
              Completed Today
              <span className="text-gray-500 font-normal">({sections.completedToday.length})</span>
            </h3>
            <ul className="space-y-1 opacity-60">
              {sections.completedToday.map(action => (
                <ActionItem key={action.id} action={action} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

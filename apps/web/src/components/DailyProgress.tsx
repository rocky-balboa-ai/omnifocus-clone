'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { CheckCircle2, Target, TrendingUp, Clock } from 'lucide-react';
import { isToday, isThisWeek, startOfDay, subDays } from 'date-fns';
import clsx from 'clsx';

interface DailyProgressProps {
  compact?: boolean;
}

export function DailyProgress({ compact = false }: DailyProgressProps) {
  const { actions, theme } = useAppStore();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());

    // Completed today
    const completedToday = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isToday(new Date(a.completedAt))
    ).length;

    // Completed this week
    const completedThisWeek = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isThisWeek(new Date(a.completedAt), { weekStartsOn: 1 })
    ).length;

    // Due today (active)
    const dueToday = actions.filter(a =>
      a.status === 'active' &&
      a.dueDate &&
      isToday(new Date(a.dueDate))
    ).length;

    // Total active
    const totalActive = actions.filter(a => a.status === 'active').length;

    // Calculate 7-day average
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, i);
      return actions.filter(a =>
        a.status === 'completed' &&
        a.completedAt &&
        isToday(new Date(a.completedAt)) === false &&
        startOfDay(new Date(a.completedAt)).getTime() === date.getTime()
      ).length;
    });
    const avgPerDay = last7Days.reduce((a, b) => a + b, 0) / 7;

    // Total time completed today (if estimatedMinutes available)
    const minutesCompletedToday = actions
      .filter(a =>
        a.status === 'completed' &&
        a.completedAt &&
        isToday(new Date(a.completedAt)) &&
        a.estimatedMinutes
      )
      .reduce((sum, a) => sum + (a.estimatedMinutes || 0), 0);

    return {
      completedToday,
      completedThisWeek,
      dueToday,
      totalActive,
      avgPerDay,
      minutesCompletedToday,
      percentOfDue: dueToday > 0 ? Math.round((completedToday / (completedToday + dueToday)) * 100) : 100,
    };
  }, [actions]);

  // Motivational messages based on progress
  const getMessage = () => {
    if (stats.completedToday >= 10) return "Incredible productivity!";
    if (stats.completedToday >= 5) return "Great momentum!";
    if (stats.completedToday >= 3) return "Nice progress!";
    if (stats.completedToday >= 1) return "Good start!";
    if (stats.dueToday > 0) return "Let's get started!";
    return "All clear!";
  };

  if (compact) {
    return (
      <div className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
        theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100'
      )}>
        <CheckCircle2 size={14} className="text-green-500" />
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {stats.completedToday}
        </span>
        <span className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          today
        </span>
        {stats.dueToday > 0 && (
          <>
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            )}>|</span>
            <Target size={14} className="text-omnifocus-orange" />
            <span className={clsx(
              'text-sm font-medium',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {stats.dueToday}
            </span>
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              due
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={clsx(
          'text-sm font-semibold',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Daily Progress
        </h3>
        <span className={clsx(
          'text-xs px-2 py-1 rounded-full',
          stats.completedToday >= 5
            ? 'bg-green-500/10 text-green-500'
            : theme === 'dark'
              ? 'bg-omnifocus-bg text-gray-400'
              : 'bg-gray-100 text-gray-500'
        )}>
          {getMessage()}
        </span>
      </div>

      {/* Progress bar */}
      {stats.dueToday > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Due today progress
            </span>
            <span className={clsx(
              'text-xs font-medium',
              stats.percentOfDue >= 100 ? 'text-green-500' :
              stats.percentOfDue >= 50 ? 'text-omnifocus-orange' :
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {stats.percentOfDue}%
            </span>
          </div>
          <div className={clsx(
            'h-2 rounded-full overflow-hidden',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
          )}>
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                stats.percentOfDue >= 100 ? 'bg-green-500' : 'bg-omnifocus-purple'
              )}
              style={{ width: `${Math.min(stats.percentOfDue, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className={clsx(
          'p-3 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Completed
            </span>
          </div>
          <p className={clsx(
            'text-2xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.completedToday}
            <span className={clsx(
              'text-sm font-normal ml-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              today
            </span>
          </p>
        </div>

        <div className={clsx(
          'p-3 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-omnifocus-orange" />
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Remaining
            </span>
          </div>
          <p className={clsx(
            'text-2xl font-bold',
            stats.dueToday > 0 ? 'text-omnifocus-orange' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
          )}>
            {stats.dueToday}
            <span className={clsx(
              'text-sm font-normal ml-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              due
            </span>
          </p>
        </div>

        <div className={clsx(
          'p-3 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-blue-400" />
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              This Week
            </span>
          </div>
          <p className={clsx(
            'text-2xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.completedThisWeek}
            <span className={clsx(
              'text-sm font-normal ml-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              done
            </span>
          </p>
        </div>

        <div className={clsx(
          'p-3 rounded-lg',
          theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-50'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-purple-400" />
            <span className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              Time Saved
            </span>
          </div>
          <p className={clsx(
            'text-2xl font-bold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {stats.minutesCompletedToday >= 60
              ? `${Math.floor(stats.minutesCompletedToday / 60)}h`
              : `${stats.minutesCompletedToday}m`}
            <span className={clsx(
              'text-sm font-normal ml-1',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              today
            </span>
          </p>
        </div>
      </div>

      {/* Average indicator */}
      {stats.avgPerDay > 0 && (
        <div className={clsx(
          'mt-3 pt-3 border-t text-xs flex items-center justify-between',
          theme === 'dark' ? 'border-omnifocus-border text-gray-500' : 'border-gray-100 text-gray-400'
        )}>
          <span>7-day average</span>
          <span className={clsx(
            'font-medium',
            stats.completedToday > stats.avgPerDay
              ? 'text-green-500'
              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {stats.avgPerDay.toFixed(1)} tasks/day
            {stats.completedToday > stats.avgPerDay && ' (above average!)'}
          </span>
        </div>
      )}
    </div>
  );
}

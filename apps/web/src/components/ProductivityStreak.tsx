'use client';

import { useMemo } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import { Flame, Zap } from 'lucide-react';
import { startOfDay, subDays, isWithinInterval, endOfDay, isSameDay } from 'date-fns';
import clsx from 'clsx';

/**
 * Calculate the current productivity streak (consecutive days with completed tasks)
 * Counts from today backwards, but if nothing completed today, starts from yesterday
 */
export function calculateStreak(actions: Action[]): number {
  const completedActions = actions.filter(a => a.status === 'completed' && a.completedAt);

  if (completedActions.length === 0) return 0;

  const today = startOfDay(new Date());

  // Check if there are completions today
  const hasCompletionsToday = completedActions.some(a =>
    isSameDay(new Date(a.completedAt!), today)
  );

  // Start counting from today if there are completions, otherwise from yesterday
  let checkDate = hasCompletionsToday ? today : subDays(today, 1);
  let streak = 0;

  // If starting from yesterday and there are no completions yesterday either, streak is 0
  if (!hasCompletionsToday) {
    const hasCompletionsYesterday = completedActions.some(a =>
      isSameDay(new Date(a.completedAt!), checkDate)
    );
    if (!hasCompletionsYesterday) return 0;
  }

  // Count consecutive days with completions
  while (true) {
    const dayStart = startOfDay(checkDate);
    const dayEnd = endOfDay(checkDate);

    const hasCompletions = completedActions.some(a =>
      isWithinInterval(new Date(a.completedAt!), { start: dayStart, end: dayEnd })
    );

    if (hasCompletions) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }

    // Safety limit - don't go back more than 1 year
    if (streak > 365) break;
  }

  return streak;
}

interface ProductivityStreakProps {
  compact?: boolean;
  className?: string;
}

export function ProductivityStreak({ compact, className }: ProductivityStreakProps) {
  const { theme, actions } = useAppStore();

  const streak = useMemo(() => calculateStreak(actions), [actions]);

  const isOnFire = streak >= 7;
  const isWarming = streak >= 3;

  if (compact) {
    return (
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg',
          isOnFire
            ? 'bg-orange-500/20 text-orange-400'
            : isWarming
            ? 'bg-yellow-500/20 text-yellow-400'
            : theme === 'dark'
            ? 'bg-omnifocus-surface text-gray-400'
            : 'bg-gray-100 text-gray-500',
          className
        )}
        title={`${streak} day${streak !== 1 ? 's' : ''} streak`}
      >
        {isOnFire ? <Flame size={14} /> : <Zap size={14} />}
        <span className="text-sm font-medium">{streak}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border',
        theme === 'dark'
          ? 'bg-omnifocus-surface border-omnifocus-border'
          : 'bg-white border-gray-200',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'p-3 rounded-xl',
            isOnFire
              ? 'bg-orange-500/20'
              : isWarming
              ? 'bg-yellow-500/20'
              : theme === 'dark'
              ? 'bg-omnifocus-bg'
              : 'bg-gray-100'
          )}
        >
          {isOnFire ? (
            <Flame
              size={24}
              className="text-orange-500"
            />
          ) : (
            <Zap
              size={24}
              className={isWarming ? 'text-yellow-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
            />
          )}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className={clsx(
                'text-3xl font-bold',
                isOnFire
                  ? 'text-orange-500'
                  : isWarming
                  ? 'text-yellow-500'
                  : theme === 'dark'
                  ? 'text-white'
                  : 'text-gray-900'
              )}
            >
              {streak}
            </span>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              day{streak !== 1 ? 's' : ''} streak
            </span>
          </div>
          <p className={clsx('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
            {streak === 0
              ? 'Complete a task to start your streak!'
              : streak < 3
              ? 'Keep going to build momentum!'
              : streak < 7
              ? 'Great progress! Keep it up!'
              : streak < 14
              ? 'You\'re on fire! Amazing streak!'
              : 'Incredible dedication! You\'re unstoppable!'}
          </p>
        </div>
      </div>
    </div>
  );
}

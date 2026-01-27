'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Flame, Zap, Trophy, Star } from 'lucide-react';
import clsx from 'clsx';
import { startOfDay, subDays, isSameDay, differenceInDays } from 'date-fns';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completedToday: number;
  lastActiveDate: string | null;
}

const STREAK_STORAGE_KEY = 'omnifocus-streak-data';

export function StreakCounter() {
  const { actions, theme } = useAppStore();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    completedToday: 0,
    lastActiveDate: null,
  });

  const todayStr = startOfDay(new Date()).toISOString();

  // Calculate streak from completed actions
  const calculatedData = useMemo(() => {
    const completedActions = actions.filter(a => a.status === 'completed' && a.completedAt);

    // Group completions by date
    const completionsByDate = new Map<string, number>();
    completedActions.forEach(action => {
      const dateKey = startOfDay(new Date(action.completedAt!)).toISOString();
      completionsByDate.set(dateKey, (completionsByDate.get(dateKey) || 0) + 1);
    });

    const today = startOfDay(new Date());
    const completedToday = completionsByDate.get(todayStr) || 0;

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = completedToday > 0 ? today : subDays(today, 1);

    while (true) {
      const dateKey = startOfDay(checkDate).toISOString();
      if (completionsByDate.has(dateKey)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedDates = Array.from(completionsByDate.keys()).sort();
    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (lastDate === null || differenceInDays(date, lastDate) === 1) {
        tempStreak++;
      } else if (differenceInDays(date, lastDate) > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = date;
    });
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalCompleted: completedActions.length,
      completedToday,
      lastActiveDate: sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null,
    };
  }, [actions, todayStr]);

  // Update streak data
  useEffect(() => {
    setStreakData(calculatedData);
  }, [calculatedData]);

  const getStreakIcon = () => {
    if (streakData.currentStreak >= 30) return Trophy;
    if (streakData.currentStreak >= 7) return Star;
    if (streakData.currentStreak >= 3) return Flame;
    return Zap;
  };

  const getStreakColor = () => {
    if (streakData.currentStreak >= 30) return 'text-yellow-400';
    if (streakData.currentStreak >= 7) return 'text-orange-400';
    if (streakData.currentStreak >= 3) return 'text-red-400';
    return 'text-blue-400';
  };

  const StreakIcon = getStreakIcon();

  if (streakData.currentStreak === 0 && streakData.completedToday === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'flex items-center gap-3 px-3 py-2 rounded-lg',
      theme === 'dark'
        ? 'bg-omnifocus-surface/50'
        : 'bg-gray-50'
    )}>
      {/* Streak icon with animation */}
      <div className={clsx(
        'relative flex items-center justify-center w-10 h-10 rounded-full',
        streakData.currentStreak >= 3 ? 'animate-pulse' : '',
        theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-white'
      )}>
        <StreakIcon size={22} className={getStreakColor()} />
        {streakData.currentStreak >= 7 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-omnifocus-orange flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">🔥</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className={clsx(
            'text-xl font-bold',
            getStreakColor()
          )}>
            {streakData.currentStreak}
          </span>
          <span className={clsx(
            'text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            day streak
          </span>
        </div>
        <div className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          {streakData.completedToday > 0
            ? `${streakData.completedToday} completed today`
            : 'Complete a task to continue!'}
        </div>
      </div>

      {/* Best streak */}
      {streakData.longestStreak > streakData.currentStreak && (
        <div className={clsx(
          'text-right text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          <div>Best</div>
          <div className={clsx(
            'font-medium',
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          )}>
            {streakData.longestStreak} days
          </div>
        </div>
      )}
    </div>
  );
}

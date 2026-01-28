'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import { Trophy, Zap, Target } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import clsx from 'clsx';

interface GlobalProgressBarProps {
  dailyGoal?: number;
}

export function GlobalProgressBar({ dailyGoal = 10 }: GlobalProgressBarProps) {
  const { actions, theme } = useAppStore();

  const progress = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    // Count completed today
    const completedToday = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isWithinInterval(new Date(a.completedAt), { start: today, end: endOfDay(now) })
    ).length;

    // Due today that are still active
    const dueToday = actions.filter(a =>
      a.status === 'active' &&
      a.dueDate &&
      isWithinInterval(new Date(a.dueDate), { start: today, end: endOfDay(now) })
    ).length;

    const percentage = Math.min((completedToday / dailyGoal) * 100, 100);
    const isGoalMet = completedToday >= dailyGoal;

    return {
      completedToday,
      dueToday,
      percentage,
      isGoalMet,
    };
  }, [actions, dailyGoal]);

  // Milestones for celebration
  const milestones = [25, 50, 75, 100];
  const currentMilestone = milestones.filter(m => progress.percentage >= m).pop() || 0;

  return (
    <div className={clsx(
      'px-4 py-2 border-b',
      theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-sidebar' : 'border-gray-200 bg-gray-50'
    )}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          progress.isGoalMet
            ? 'bg-green-500/20 text-green-500'
            : 'bg-omnifocus-purple/20 text-omnifocus-purple'
        )}>
          {progress.isGoalMet ? (
            <Trophy size={16} />
          ) : progress.percentage >= 50 ? (
            <Zap size={16} />
          ) : (
            <Target size={16} />
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={clsx(
              'text-xs font-medium',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              {progress.isGoalMet ? (
                <span className="text-green-500">Daily goal achieved!</span>
              ) : (
                <>
                  <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                    {progress.completedToday}
                  </span>
                  {' / '}{dailyGoal} tasks
                </>
              )}
            </span>
            {progress.dueToday > 0 && (
              <span className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {progress.dueToday} due today
              </span>
            )}
          </div>

          {/* Progress track */}
          <div className={clsx(
            'h-2 rounded-full overflow-hidden relative',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-200'
          )}>
            {/* Milestone markers */}
            {milestones.map(milestone => (
              <div
                key={milestone}
                className={clsx(
                  'absolute top-0 bottom-0 w-0.5',
                  theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-300'
                )}
                style={{ left: `${milestone}%` }}
              />
            ))}

            {/* Progress fill */}
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500 relative',
                progress.isGoalMet ? 'bg-green-500' : 'bg-omnifocus-purple'
              )}
              style={{ width: `${progress.percentage}%` }}
            >
              {/* Shimmer effect when goal is met */}
              {progress.isGoalMet && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>
        </div>

        {/* Milestone badges */}
        <div className="flex gap-1">
          {[25, 50, 75, 100].map(milestone => (
            <div
              key={milestone}
              className={clsx(
                'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors',
                progress.percentage >= milestone
                  ? milestone === 100
                    ? 'bg-green-500 text-white'
                    : 'bg-omnifocus-purple text-white'
                  : theme === 'dark'
                    ? 'bg-omnifocus-border text-gray-600'
                    : 'bg-gray-200 text-gray-400'
              )}
              title={`${milestone}% milestone`}
            >
              {milestone === 100 ? '★' : Math.floor(milestone / 25)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

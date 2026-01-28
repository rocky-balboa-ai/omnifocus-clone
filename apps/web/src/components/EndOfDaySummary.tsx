'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Moon,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  ChevronRight,
} from 'lucide-react';
import { isToday, format, addDays, isTomorrow } from 'date-fns';
import clsx from 'clsx';

const SUMMARY_KEY = 'omnifocus-last-eod-summary';

export function EndOfDaySummary() {
  const { actions, theme, setSelectedAction, setCurrentPerspective } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if we should show the summary (after 6 PM)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTime = () => {
      const hour = new Date().getHours();
      const lastSummary = localStorage.getItem(SUMMARY_KEY);
      const today = format(new Date(), 'yyyy-MM-dd');

      // Show summary between 6 PM and midnight if not shown today
      if (hour >= 18 && lastSummary !== today && !isDismissed) {
        setIsVisible(true);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [isDismissed]);

  const handleDismiss = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(SUMMARY_KEY, today);
    setIsVisible(false);
    setIsDismissed(true);
  };

  const stats = useMemo(() => {
    const completedToday = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isToday(new Date(a.completedAt))
    );

    const activeActions = actions.filter(a => a.status === 'active');

    const dueTomorrow = activeActions.filter(a =>
      a.dueDate && isTomorrow(new Date(a.dueDate))
    );

    const leftOverToday = activeActions.filter(a =>
      a.dueDate && isToday(new Date(a.dueDate))
    );

    const flaggedRemaining = activeActions.filter(a => a.flagged);

    const totalTimeCompleted = completedToday.reduce(
      (sum, a) => sum + (a.estimatedMinutes || 0),
      0
    );

    return {
      completedToday: completedToday.length,
      totalTimeCompleted,
      dueTomorrow: dueTomorrow.length,
      leftOverToday: leftOverToday.length,
      flaggedRemaining: flaggedRemaining.length,
      topCompleted: completedToday.slice(0, 3),
      tomorrowPreview: dueTomorrow.slice(0, 3),
    };
  }, [actions]);

  const getMotivationalMessage = () => {
    if (stats.completedToday >= 10) return "Incredible productivity! You're on fire!";
    if (stats.completedToday >= 5) return "Great job today! Keep up the momentum.";
    if (stats.completedToday >= 3) return "Nice work! Every task completed counts.";
    if (stats.completedToday >= 1) return "Good start! Tomorrow is another opportunity.";
    return "Rest up and come back stronger tomorrow!";
  };

  if (!isVisible) return null;

  return (
    <div className={clsx(
      'fixed inset-0 z-50 flex items-center justify-center p-4',
      'animate-in fade-in duration-300'
    )}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Content */}
      <div className={clsx(
        'relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden',
        'animate-in zoom-in-95 duration-300',
        theme === 'dark'
          ? 'bg-gradient-to-br from-omnifocus-sidebar to-omnifocus-bg'
          : 'bg-gradient-to-br from-white to-gray-50'
      )}>
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={clsx(
            'absolute top-4 right-4 p-2 rounded-lg transition-colors',
            theme === 'dark'
              ? 'text-gray-500 hover:text-white hover:bg-omnifocus-surface'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={clsx(
              'p-2 rounded-xl',
              theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100'
            )}>
              <Moon size={24} className="text-indigo-400" />
            </div>
            <div>
              <h2 className={clsx(
                'text-2xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                End of Day Summary
              </h2>
              <p className={clsx(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
        </div>

        {/* Main stats */}
        <div className={clsx(
          'px-6 py-4 border-t border-b',
          theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-bg/50' : 'border-gray-100 bg-gray-50/50'
        )}>
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 size={24} className="text-green-500" />
              <span className={clsx(
                'text-4xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {stats.completedToday}
              </span>
            </div>
            <p className={clsx(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              tasks completed today
              {stats.totalTimeCompleted > 0 && (
                <span className="ml-2">
                  ({stats.totalTimeCompleted >= 60
                    ? `${Math.floor(stats.totalTimeCompleted / 60)}h ${stats.totalTimeCompleted % 60}m`
                    : `${stats.totalTimeCompleted}m`
                  } of work)
                </span>
              )}
            </p>
          </div>

          <div className={clsx(
            'text-center p-3 rounded-lg',
            stats.completedToday >= 5
              ? 'bg-green-500/10 text-green-400'
              : theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-400'
                : 'bg-gray-100 text-gray-500'
          )}>
            <Star size={16} className="inline mr-2" />
            {getMotivationalMessage()}
          </div>
        </div>

        {/* Tomorrow preview */}
        {stats.dueTomorrow > 0 && (
          <div className="p-6 pt-4">
            <h3 className={clsx(
              'text-sm font-semibold mb-3 flex items-center gap-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Calendar size={14} className="text-omnifocus-orange" />
              Tomorrow ({stats.dueTomorrow} task{stats.dueTomorrow !== 1 ? 's' : ''})
            </h3>
            <ul className="space-y-2">
              {stats.tomorrowPreview.map(action => (
                <li
                  key={action.id}
                  className={clsx(
                    'flex items-center gap-3 p-2 rounded-lg',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface'
                      : 'bg-white shadow-sm'
                  )}
                >
                  <Calendar size={14} className="text-omnifocus-orange shrink-0" />
                  <span className={clsx(
                    'text-sm flex-1 truncate',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}>
                    {action.title}
                  </span>
                </li>
              ))}
              {stats.dueTomorrow > 3 && (
                <p className={clsx(
                  'text-xs text-center',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                )}>
                  +{stats.dueTomorrow - 3} more
                </p>
              )}
            </ul>
          </div>
        )}

        {/* Leftover warning */}
        {stats.leftOverToday > 0 && (
          <div className={clsx(
            'mx-6 mb-4 p-3 rounded-lg flex items-center gap-3',
            theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
          )}>
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <p className={clsx(
              'text-sm',
              theme === 'dark' ? 'text-red-300' : 'text-red-600'
            )}>
              {stats.leftOverToday} task{stats.leftOverToday !== 1 ? 's' : ''} still due today. Consider rescheduling or completing them.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={() => {
              setCurrentPerspective('forecast');
              handleDismiss();
            }}
            className="flex-1 py-3 rounded-xl bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
          >
            Plan Tomorrow
          </button>
          <button
            onClick={handleDismiss}
            className={clsx(
              'px-6 py-3 rounded-xl font-medium transition-colors',
              theme === 'dark'
                ? 'bg-omnifocus-surface text-gray-300 hover:bg-omnifocus-border'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

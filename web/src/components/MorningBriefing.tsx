'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  Sun,
  Moon,
  CloudSun,
  X,
  Calendar,
  Flag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Coffee,
} from 'lucide-react';
import { isToday, isPast, format, isBefore, startOfDay } from 'date-fns';
import clsx from 'clsx';

const BRIEFING_KEY = 'omnifocus-last-briefing';

export function MorningBriefing() {
  const { actions, theme, setSelectedAction, setCurrentPerspective } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if we should show the briefing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastBriefing = localStorage.getItem(BRIEFING_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');

    // Show briefing if it's a new day
    if (lastBriefing !== today && !isDismissed) {
      // Delay a bit for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDismissed]);

  const handleDismiss = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(BRIEFING_KEY, today);
    setIsVisible(false);
    setIsDismissed(true);
  };

  // Calculate briefing stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const activeActions = actions.filter(a => a.status === 'active');

    const overdue = activeActions.filter(a =>
      a.dueDate && isBefore(new Date(a.dueDate), today)
    );

    const dueToday = activeActions.filter(a =>
      a.dueDate && isToday(new Date(a.dueDate))
    );

    const flagged = activeActions.filter(a => a.flagged);

    const yesterdayCompleted = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      isToday(new Date(a.completedAt))
    );

    // Top priority items for today
    const topPriority = [...overdue, ...dueToday, ...flagged.filter(a => !a.dueDate)]
      .slice(0, 3);

    // Estimated work time
    const totalMinutes = [...overdue, ...dueToday].reduce(
      (sum, a) => sum + (a.estimatedMinutes || 15),
      0
    );

    return {
      overdue: overdue.length,
      dueToday: dueToday.length,
      flagged: flagged.length,
      totalActive: activeActions.length,
      yesterdayCompleted: yesterdayCompleted.length,
      topPriority,
      totalMinutes,
    };
  }, [actions]);

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: Coffee };
    if (hour < 17) return { text: 'Good afternoon', icon: Sun };
    return { text: 'Good evening', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

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
              theme === 'dark' ? 'bg-omnifocus-orange/20' : 'bg-orange-100'
            )}>
              <GreetingIcon size={24} className="text-omnifocus-orange" />
            </div>
            <div>
              <h2 className={clsx(
                'text-2xl font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {greeting.text}!
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

        {/* Stats Overview */}
        <div className={clsx(
          'px-6 py-4 border-t border-b',
          theme === 'dark' ? 'border-omnifocus-border bg-omnifocus-bg/50' : 'border-gray-100 bg-gray-50/50'
        )}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className={clsx(
                'text-2xl font-bold',
                stats.overdue > 0 ? 'text-red-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
              )}>
                {stats.overdue}
              </p>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Overdue
              </p>
            </div>
            <div>
              <p className={clsx(
                'text-2xl font-bold',
                stats.dueToday > 0 ? 'text-omnifocus-orange' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
              )}>
                {stats.dueToday}
              </p>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Due Today
              </p>
            </div>
            <div>
              <p className={clsx(
                'text-2xl font-bold',
                stats.flagged > 0 ? 'text-omnifocus-purple' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
              )}>
                {stats.flagged}
              </p>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                Flagged
              </p>
            </div>
          </div>

          {stats.totalMinutes > 0 && (
            <div className={clsx(
              'mt-4 pt-3 border-t text-center',
              theme === 'dark' ? 'border-omnifocus-border' : 'border-gray-200'
            )}>
              <p className={clsx(
                'text-sm',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                <Clock size={14} className="inline mr-1" />
                Estimated work: {stats.totalMinutes >= 60
                  ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
                  : `${stats.totalMinutes}m`
                }
              </p>
            </div>
          )}
        </div>

        {/* Top Priority Items */}
        {stats.topPriority.length > 0 && (
          <div className="p-6 pt-4">
            <h3 className={clsx(
              'text-sm font-semibold mb-3 flex items-center gap-2',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              <Sparkles size={14} className="text-omnifocus-purple" />
              Top priorities for today
            </h3>
            <ul className="space-y-2">
              {stats.topPriority.map(action => (
                <li
                  key={action.id}
                  onClick={() => {
                    setSelectedAction(action.id);
                    handleDismiss();
                  }}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    theme === 'dark'
                      ? 'bg-omnifocus-surface hover:bg-omnifocus-border'
                      : 'bg-white hover:bg-gray-100 shadow-sm'
                  )}
                >
                  {action.dueDate && isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate)) ? (
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  ) : action.flagged ? (
                    <Flag size={16} className="text-omnifocus-orange shrink-0" />
                  ) : (
                    <Calendar size={16} className="text-omnifocus-purple shrink-0" />
                  )}
                  <span className={clsx(
                    'text-sm flex-1 truncate',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {action.title}
                  </span>
                  <ChevronRight size={14} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action button */}
        <div className={clsx(
          'p-6 pt-2 flex gap-3',
        )}>
          <button
            onClick={() => {
              setCurrentPerspective('today');
              handleDismiss();
            }}
            className="flex-1 py-3 rounded-xl bg-omnifocus-purple text-white font-medium hover:bg-omnifocus-purple/90 transition-colors"
          >
            Start My Day
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
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

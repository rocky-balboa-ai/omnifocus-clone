'use client';

import { useMemo } from 'react';
import { useAppStore, Action } from '@/stores/app.store';
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Flag,
  Zap,
  Coffee,
  Sun,
  Moon,
  Calendar,
  Target,
  ChevronRight,
} from 'lucide-react';
import { isToday, isPast, isFuture, differenceInHours, startOfDay } from 'date-fns';
import clsx from 'clsx';

interface SuggestedAction {
  action: Action;
  reason: string;
  icon: any;
  priority: number;
}

export function SmartSuggestions() {
  const { actions, theme, setSelectedAction } = useAppStore();

  const suggestions = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const today = startOfDay(now);

    const activeActions = actions.filter(a => a.status === 'active');
    const suggested: SuggestedAction[] = [];

    // Priority 1: Overdue tasks
    const overdue = activeActions.filter(a =>
      a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
    );
    overdue.forEach(action => {
      suggested.push({
        action,
        reason: 'Overdue',
        icon: AlertTriangle,
        priority: 100,
      });
    });

    // Priority 2: Due today
    const dueToday = activeActions.filter(a =>
      a.dueDate && isToday(new Date(a.dueDate))
    );
    dueToday.forEach(action => {
      suggested.push({
        action,
        reason: 'Due today',
        icon: Calendar,
        priority: 90,
      });
    });

    // Priority 3: Flagged tasks
    const flagged = activeActions.filter(a =>
      a.flagged && !a.dueDate
    );
    flagged.forEach(action => {
      suggested.push({
        action,
        reason: 'Flagged',
        icon: Flag,
        priority: 80,
      });
    });

    // Time-of-day based suggestions
    if (hour >= 6 && hour < 10) {
      // Morning - suggest quick wins to build momentum
      const quickTasks = activeActions.filter(a =>
        a.estimatedMinutes && a.estimatedMinutes <= 15 && !a.dueDate && !a.flagged
      );
      quickTasks.slice(0, 2).forEach(action => {
        suggested.push({
          action,
          reason: 'Quick morning win',
          icon: Coffee,
          priority: 70,
        });
      });
    } else if (hour >= 10 && hour < 14) {
      // Mid-day - suggest focus work
      const focusTasks = activeActions.filter(a =>
        a.estimatedMinutes && a.estimatedMinutes >= 30 && !a.dueDate && !a.flagged
      );
      focusTasks.slice(0, 2).forEach(action => {
        suggested.push({
          action,
          reason: 'Deep work time',
          icon: Target,
          priority: 70,
        });
      });
    } else if (hour >= 14 && hour < 17) {
      // Afternoon - suggest medium tasks
      const mediumTasks = activeActions.filter(a =>
        a.estimatedMinutes && a.estimatedMinutes >= 15 && a.estimatedMinutes <= 30 &&
        !a.dueDate && !a.flagged
      );
      mediumTasks.slice(0, 2).forEach(action => {
        suggested.push({
          action,
          reason: 'Afternoon focus',
          icon: Sun,
          priority: 70,
        });
      });
    } else if (hour >= 17 && hour < 21) {
      // Evening - suggest quick tasks
      const quickTasks = activeActions.filter(a =>
        (!a.estimatedMinutes || a.estimatedMinutes <= 15) && !a.dueDate && !a.flagged
      );
      quickTasks.slice(0, 2).forEach(action => {
        suggested.push({
          action,
          reason: 'Evening wind-down',
          icon: Moon,
          priority: 70,
        });
      });
    }

    // Low effort tasks (quick wins)
    if (suggested.length < 5) {
      const quickWins = activeActions.filter(a =>
        a.estimatedMinutes && a.estimatedMinutes <= 5 &&
        !suggested.some(s => s.action.id === a.id)
      );
      quickWins.slice(0, 2).forEach(action => {
        suggested.push({
          action,
          reason: '< 5 min task',
          icon: Zap,
          priority: 60,
        });
      });
    }

    // Remove duplicates and sort by priority
    const uniqueSuggestions = suggested.reduce((acc, curr) => {
      if (!acc.some(s => s.action.id === curr.action.id)) {
        acc.push(curr);
      }
      return acc;
    }, [] as SuggestedAction[]);

    return uniqueSuggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);
  }, [actions]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      {/* Header */}
      <div className={clsx(
        'flex items-center gap-2 px-4 py-3 border-b',
        theme === 'dark'
          ? 'bg-omnifocus-purple/10 border-omnifocus-border'
          : 'bg-purple-50 border-gray-200'
      )}>
        <Sparkles size={16} className="text-omnifocus-purple" />
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          Suggested Next
        </span>
        <span className={clsx(
          'text-xs',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        )}>
          Based on your schedule
        </span>
      </div>

      {/* Suggestions */}
      <ul>
        {suggestions.map(({ action, reason, icon: Icon }) => (
          <li
            key={action.id}
            onClick={() => setSelectedAction(action.id)}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0',
              theme === 'dark'
                ? 'hover:bg-omnifocus-bg border-omnifocus-border/50'
                : 'hover:bg-gray-50 border-gray-100'
            )}
          >
            <div className={clsx(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
              reason === 'Overdue'
                ? 'bg-red-500/10 text-red-400'
                : reason === 'Flagged'
                  ? 'bg-orange-500/10 text-orange-400'
                  : theme === 'dark'
                    ? 'bg-omnifocus-bg text-gray-400'
                    : 'bg-gray-100 text-gray-500'
            )}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={clsx(
                'text-sm truncate',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                {action.title}
              </p>
              <p className={clsx(
                'text-xs',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}>
                {reason}
                {action.estimatedMinutes && ` · ${action.estimatedMinutes}m`}
                {action.project && ` · ${action.project.name}`}
              </p>
            </div>
            <ChevronRight size={16} className={clsx(
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            )} />
          </li>
        ))}
      </ul>
    </div>
  );
}

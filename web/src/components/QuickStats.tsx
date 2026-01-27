'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  CheckCircle2,
  Clock,
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
  Flag,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  isToday,
  isPast,
  isFuture,
  differenceInDays,
  subWeeks,
} from 'date-fns';
import clsx from 'clsx';

interface QuickStatsProps {
  className?: string;
}

export function QuickStats({ className }: QuickStatsProps) {
  const { theme, actions } = useAppStore();

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastWeekEnd = subWeeks(weekEnd, 1);

    // Active tasks
    const activeTasks = actions.filter(a => a.status === 'active');

    // Due today
    const dueToday = activeTasks.filter(a =>
      a.dueDate && isToday(new Date(a.dueDate))
    ).length;

    // Overdue
    const overdue = activeTasks.filter(a =>
      a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))
    ).length;

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
      new Date(a.completedAt) >= weekStart &&
      new Date(a.completedAt) <= weekEnd
    ).length;

    // Completed last week (for comparison)
    const completedLastWeek = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      new Date(a.completedAt) >= lastWeekStart &&
      new Date(a.completedAt) <= lastWeekEnd
    ).length;

    // Week trend
    const weekTrend = completedLastWeek > 0
      ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
      : completedThisWeek > 0 ? 100 : 0;

    // Flagged tasks
    const flaggedCount = activeTasks.filter(a => a.flagged).length;

    // Upcoming (due in next 7 days)
    const upcoming = activeTasks.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      return daysUntilDue > 0 && daysUntilDue <= 7;
    }).length;

    // Total estimated time for today's tasks
    const estimatedMinutesToday = activeTasks
      .filter(a => (a.dueDate && isToday(new Date(a.dueDate))) || a.flagged)
      .reduce((sum, a) => sum + (a.estimatedMinutes || 0), 0);

    return {
      activeCount: activeTasks.length,
      dueToday,
      overdue,
      completedToday,
      completedThisWeek,
      weekTrend,
      flaggedCount,
      upcoming,
      estimatedMinutesToday,
    };
  }, [actions]);

  const statCards = [
    {
      label: 'Due Today',
      value: stats.dueToday,
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/20',
      highlight: stats.overdue > 0,
    },
    {
      label: 'Flagged',
      value: stats.flaggedCount,
      icon: Flag,
      color: 'text-omnifocus-orange',
      bgColor: 'bg-orange-500/20',
    },
    {
      label: 'Done Today',
      value: stats.completedToday,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
    },
  ];

  return (
    <div className={clsx('grid grid-cols-4 gap-4', className)}>
      {statCards.map(stat => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={clsx(
              'p-4 rounded-xl',
              theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
              stat.highlight && 'ring-2 ring-red-500'
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
              stat.bgColor
            )}>
              <Icon size={20} className={stat.color} />
            </div>
            <p className={clsx(
              'text-2xl font-bold',
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            )}>
              {stat.value}
            </p>
            <p className={clsx(
              'text-xs',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            )}>
              {stat.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Compact stats row
export function QuickStatsRow({ className }: { className?: string }) {
  const { theme, actions } = useAppStore();

  const stats = useMemo(() => {
    const activeTasks = actions.filter(a => a.status === 'active');
    const today = startOfDay(new Date());

    return {
      active: activeTasks.length,
      dueToday: activeTasks.filter(a => a.dueDate && isToday(new Date(a.dueDate))).length,
      overdue: activeTasks.filter(a => a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate))).length,
      flagged: activeTasks.filter(a => a.flagged).length,
      completedToday: actions.filter(a => a.status === 'completed' && a.completedAt && isToday(new Date(a.completedAt))).length,
    };
  }, [actions]);

  const items = [
    { label: 'Active', value: stats.active, icon: Target },
    { label: 'Due Today', value: stats.dueToday, icon: Calendar, color: stats.dueToday > 0 ? 'text-blue-500' : undefined },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: stats.overdue > 0 ? 'text-red-500' : undefined },
    { label: 'Flagged', value: stats.flagged, icon: Flag, color: stats.flagged > 0 ? 'text-omnifocus-orange' : undefined },
    { label: 'Done', value: stats.completedToday, icon: CheckCircle2, color: stats.completedToday > 0 ? 'text-green-500' : undefined },
  ];

  return (
    <div className={clsx('flex items-center gap-4', className)}>
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-1.5"
          >
            <Icon size={14} className={item.color || (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')} />
            <span className={clsx(
              'text-sm font-medium',
              item.color || (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
            )}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Weekly performance widget
export function WeeklyPerformance({ className }: { className?: string }) {
  const { theme, actions } = useAppStore();

  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const lastWeekStart = subWeeks(weekStart, 1);

    const thisWeek = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      new Date(a.completedAt) >= weekStart
    ).length;

    const lastWeek = actions.filter(a =>
      a.status === 'completed' &&
      a.completedAt &&
      new Date(a.completedAt) >= lastWeekStart &&
      new Date(a.completedAt) < weekStart
    ).length;

    const trend = lastWeek > 0
      ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
      : thisWeek > 0 ? 100 : 0;

    return { thisWeek, lastWeek, trend };
  }, [actions]);

  const isPositive = data.trend >= 0;

  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          This Week
        </span>
        <div className={clsx(
          'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          isPositive
            ? 'bg-green-500/20 text-green-500'
            : 'bg-red-500/20 text-red-500'
        )}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(data.trend)}%
        </div>
      </div>
      <p className={clsx(
        'text-3xl font-bold',
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      )}>
        {data.thisWeek}
      </p>
      <p className={clsx(
        'text-xs',
        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
      )}>
        tasks completed vs {data.lastWeek} last week
      </p>
    </div>
  );
}

// Productivity score widget
export function ProductivityScore({ className }: { className?: string }) {
  const { theme, actions } = useAppStore();

  const score = useMemo(() => {
    const today = startOfDay(new Date());
    const activeTasks = actions.filter(a => a.status === 'active');

    // Calculate various factors
    const completedToday = actions.filter(a =>
      a.status === 'completed' && a.completedAt && isToday(new Date(a.completedAt))
    ).length;

    const overdueCount = activeTasks.filter(a =>
      a.dueDate && isPast(new Date(a.dueDate))
    ).length;

    const flaggedDoneToday = actions.filter(a =>
      a.status === 'completed' &&
      a.flagged &&
      a.completedAt &&
      isToday(new Date(a.completedAt))
    ).length;

    // Calculate score (0-100)
    // Base: completed tasks (max 50 points)
    let scoreValue = Math.min(50, completedToday * 10);

    // Penalty for overdue (up to -30 points)
    scoreValue -= Math.min(30, overdueCount * 5);

    // Bonus for flagged tasks done (up to 20 points)
    scoreValue += Math.min(20, flaggedDoneToday * 10);

    // Minimum 0
    return Math.max(0, Math.min(100, Math.round(scoreValue)));
  }, [actions]);

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Focus';
  };

  return (
    <div className={clsx(
      'p-4 rounded-xl',
      theme === 'dark' ? 'bg-omnifocus-surface' : 'bg-gray-100',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-omnifocus-purple" />
        <span className={clsx(
          'text-sm font-medium',
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        )}>
          Productivity Score
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={clsx('text-4xl font-bold', getScoreColor())}>
            {score}
          </p>
          <p className={clsx(
            'text-xs',
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}>
            {getScoreLabel()}
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="w-24">
          <div className={clsx(
            'h-2 rounded-full overflow-hidden',
            theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-200'
          )}>
            <div
              className={clsx('h-full rounded-full transition-all', getScoreColor().replace('text-', 'bg-'))}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

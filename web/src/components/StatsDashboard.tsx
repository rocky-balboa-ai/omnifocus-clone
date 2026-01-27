'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app.store';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  Search,
  Plus,
} from 'lucide-react';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import clsx from 'clsx';

export function StatsDashboard() {
  const {
    actions,
    projects,
    isLoading,
    setQuickEntryOpen,
    setSearchOpen,
    theme,
  } = useAppStore();

  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const last7Days = subDays(today, 6);

    // All completed actions
    const completedActions = actions.filter(a => a.status === 'completed' && a.completedAt);

    // Completed today
    const completedToday = completedActions.filter(a =>
      isWithinInterval(new Date(a.completedAt!), { start: today, end: endOfDay(now) })
    );

    // Completed this week
    const completedThisWeek = completedActions.filter(a =>
      isWithinInterval(new Date(a.completedAt!), { start: weekStart, end: now })
    );

    // Daily completions for the last 7 days
    const days = eachDayOfInterval({ start: last7Days, end: today });
    const dailyCompletions = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const count = completedActions.filter(a =>
        isWithinInterval(new Date(a.completedAt!), { start: dayStart, end: dayEnd })
      ).length;
      return { date: day, count };
    });

    // Active actions stats
    const activeActions = actions.filter(a => a.status === 'active');
    const flaggedCount = activeActions.filter(a => a.flagged).length;
    const overdueCount = activeActions.filter(a => {
      if (!a.dueDate) return false;
      return new Date(a.dueDate) < today;
    }).length;

    // Calculate streak (consecutive days with completions)
    let streak = 0;
    for (let i = dailyCompletions.length - 1; i >= 0; i--) {
      if (dailyCompletions[i].count > 0) {
        streak++;
      } else if (i < dailyCompletions.length - 1) {
        // Only break if it's not today (allow today to have 0)
        break;
      }
    }

    // Active projects
    const activeProjects = projects.filter(p => p.status === 'active').length;

    // Average daily completions
    const totalCompletions = dailyCompletions.reduce((sum, d) => sum + d.count, 0);
    const avgDaily = Math.round((totalCompletions / 7) * 10) / 10;

    // Max completions in a day
    const maxDaily = Math.max(...dailyCompletions.map(d => d.count), 1);

    return {
      completedToday: completedToday.length,
      completedThisWeek: completedThisWeek.length,
      totalActive: activeActions.length,
      flaggedCount,
      overdueCount,
      streak,
      activeProjects,
      avgDaily,
      dailyCompletions,
      maxDaily,
    };
  }, [actions, projects]);

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
          <BarChart3 size={24} className="text-omnifocus-purple" />
          <h2 className={clsx(
            'text-xl md:text-2xl font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Statistics
          </h2>
        </div>

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

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<CheckCircle2 size={20} />}
            iconColor="text-green-500"
            label="Today"
            value={stats.completedToday}
            theme={theme}
          />
          <StatCard
            icon={<Calendar size={20} />}
            iconColor="text-blue-400"
            label="This Week"
            value={stats.completedThisWeek}
            theme={theme}
          />
          <StatCard
            icon={<Flame size={20} />}
            iconColor="text-omnifocus-orange"
            label="Day Streak"
            value={stats.streak}
            suffix="days"
            theme={theme}
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            iconColor="text-omnifocus-purple"
            label="Daily Avg"
            value={stats.avgDaily}
            theme={theme}
          />
        </div>

        {/* 7-Day Activity Chart */}
        <div className={clsx(
          'p-4 rounded-xl border mb-6',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <h3 className={clsx(
            'text-sm font-semibold mb-4',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Last 7 Days
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.dailyCompletions.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={clsx(
                    'w-full rounded-t transition-all',
                    day.count > 0 ? 'bg-omnifocus-purple' : (theme === 'dark' ? 'bg-omnifocus-border' : 'bg-gray-200')
                  )}
                  style={{
                    height: `${Math.max((day.count / stats.maxDaily) * 100, 4)}%`,
                    minHeight: '4px',
                  }}
                  title={`${day.count} completed`}
                />
                <div className="text-center">
                  <p className={clsx(
                    'text-xs font-medium',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {day.count}
                  </p>
                  <p className={clsx(
                    'text-[10px]',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {format(day.date, 'EEE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Status */}
        <div className={clsx(
          'p-4 rounded-xl border',
          theme === 'dark'
            ? 'bg-omnifocus-surface border-omnifocus-border'
            : 'bg-white border-gray-200'
        )}>
          <h3 className={clsx(
            'text-sm font-semibold mb-4',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            Current Status
          </h3>
          <div className="space-y-3">
            <StatusRow
              label="Active Actions"
              value={stats.totalActive}
              icon={<Target size={16} />}
              theme={theme}
            />
            <StatusRow
              label="Active Projects"
              value={stats.activeProjects}
              icon={<Calendar size={16} />}
              theme={theme}
            />
            <StatusRow
              label="Flagged Items"
              value={stats.flaggedCount}
              icon={<Flame size={16} />}
              color="text-omnifocus-orange"
              theme={theme}
            />
            <StatusRow
              label="Overdue"
              value={stats.overdueCount}
              icon={<Clock size={16} />}
              color={stats.overdueCount > 0 ? 'text-red-400' : undefined}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
  suffix,
  theme,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: number;
  suffix?: string;
  theme: 'light' | 'dark';
}) {
  return (
    <div className={clsx(
      'p-4 rounded-xl border',
      theme === 'dark'
        ? 'bg-omnifocus-surface border-omnifocus-border'
        : 'bg-white border-gray-200'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <span className={clsx('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
          {label}
        </span>
      </div>
      <p className={clsx('text-2xl font-bold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  icon,
  color,
  theme,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
  theme: 'light' | 'dark';
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={color || (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
          {icon}
        </span>
        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
          {label}
        </span>
      </div>
      <span className={clsx(
        'font-semibold',
        color || (theme === 'dark' ? 'text-white' : 'text-gray-900')
      )}>
        {value}
      </span>
    </div>
  );
}

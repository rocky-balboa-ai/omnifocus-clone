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
  FolderKanban,
  Tags,
  Zap,
} from 'lucide-react';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  eachDayOfInterval,
  getHours,
  subWeeks,
} from 'date-fns';
import clsx from 'clsx';
import { ProductivityStreak } from './ProductivityStreak';

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
    const last4Weeks = subWeeks(today, 3);

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

    // Productivity by hour (when actions are completed)
    const hourlyCompletions: Record<number, number> = {};
    completedActions.forEach(a => {
      const hour = getHours(new Date(a.completedAt!));
      hourlyCompletions[hour] = (hourlyCompletions[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourlyCompletions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Weekly comparison (this week vs last week)
    const lastWeekStart = subWeeks(weekStart, 1);
    const completedLastWeek = completedActions.filter(a =>
      isWithinInterval(new Date(a.completedAt!), { start: lastWeekStart, end: subDays(weekStart, 1) })
    ).length;
    const weeklyChange = completedLastWeek > 0
      ? Math.round(((completedThisWeek.length - completedLastWeek) / completedLastWeek) * 100)
      : 0;

    // Project progress
    const projectProgress = projects
      .filter(p => p.status === 'active')
      .map(p => {
        const projectActions = actions.filter(a => a.projectId === p.id);
        const completed = projectActions.filter(a => a.status === 'completed').length;
        const total = projectActions.length;
        return {
          id: p.id,
          name: p.name,
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Tag usage stats
    const tagUsage: Record<string, number> = {};
    activeActions.forEach(a => {
      a.tags?.forEach(({ tag }) => {
        tagUsage[tag.id] = (tagUsage[tag.id] || 0) + 1;
      });
    });

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
      peakHours,
      weeklyChange,
      projectProgress,
      tagUsage,
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

        {/* Productivity Streak Widget */}
        <ProductivityStreak className="mb-6" />

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

        {/* Current Status and Weekly Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          {/* Weekly Trend & Peak Hours */}
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
              Productivity Insights
            </h3>
            <div className="space-y-4">
              {/* Weekly Change */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className={stats.weeklyChange >= 0 ? 'text-green-500' : 'text-red-400'} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    vs Last Week
                  </span>
                </div>
                <span className={clsx(
                  'font-semibold',
                  stats.weeklyChange >= 0 ? 'text-green-500' : 'text-red-400'
                )}>
                  {stats.weeklyChange >= 0 ? '+' : ''}{stats.weeklyChange}%
                </span>
              </div>

              {/* Peak Hours */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-yellow-500" />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                    Peak Productivity
                  </span>
                </div>
                <div className="flex gap-2">
                  {stats.peakHours.length > 0 ? stats.peakHours.map((hour, i) => (
                    <span
                      key={hour}
                      className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        i === 0
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : theme === 'dark'
                            ? 'bg-omnifocus-bg text-gray-400'
                            : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                    </span>
                  )) : (
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                      No data yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        {stats.projectProgress.length > 0 && (
          <div className={clsx(
            'p-4 rounded-xl border mb-6',
            theme === 'dark'
              ? 'bg-omnifocus-surface border-omnifocus-border'
              : 'bg-white border-gray-200'
          )}>
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban size={18} className="text-blue-400" />
              <h3 className={clsx(
                'text-sm font-semibold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                Project Progress
              </h3>
            </div>
            <div className="space-y-4">
              {stats.projectProgress.map(project => (
                <div key={project.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx(
                      'text-sm truncate flex-1 mr-2',
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    )}>
                      {project.name}
                    </span>
                    <span className={clsx(
                      'text-xs font-medium',
                      project.percentage === 100
                        ? 'text-green-500'
                        : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {project.completed}/{project.total}
                    </span>
                  </div>
                  <div className={clsx(
                    'h-2 rounded-full overflow-hidden',
                    theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100'
                  )}>
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        project.percentage === 100 ? 'bg-green-500' :
                        project.percentage >= 75 ? 'bg-blue-500' :
                        project.percentage >= 50 ? 'bg-yellow-500' :
                        'bg-omnifocus-purple'
                      )}
                      style={{ width: `${project.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productivity Heatmap */}
        <ProductivityHeatmap
          dailyCompletions={stats.dailyCompletions}
          theme={theme}
        />
      </div>
    </div>
  );
}

// Productivity Heatmap Component
function ProductivityHeatmap({
  dailyCompletions,
  theme,
}: {
  dailyCompletions: { date: Date; count: number }[];
  theme: 'light' | 'dark';
}) {
  // Generate a simple heatmap based on completion counts
  const max = Math.max(...dailyCompletions.map(d => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100';
    const intensity = count / max;
    if (intensity >= 0.75) return 'bg-green-500';
    if (intensity >= 0.5) return 'bg-green-400';
    if (intensity >= 0.25) return 'bg-green-300';
    return 'bg-green-200';
  };

  return (
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
        Activity Heatmap
      </h3>
      <div className="flex gap-1">
        {dailyCompletions.map((day, i) => (
          <div
            key={i}
            className={clsx(
              'flex-1 aspect-square rounded',
              getColor(day.count)
            )}
            title={`${format(day.date, 'MMM d')}: ${day.count} completed`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={clsx('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
          Less
        </span>
        <div className="flex gap-1">
          <div className={clsx('w-3 h-3 rounded', theme === 'dark' ? 'bg-omnifocus-bg' : 'bg-gray-100')} />
          <div className="w-3 h-3 rounded bg-green-200" />
          <div className="w-3 h-3 rounded bg-green-300" />
          <div className="w-3 h-3 rounded bg-green-400" />
          <div className="w-3 h-3 rounded bg-green-500" />
        </div>
        <span className={clsx('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
          More
        </span>
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
